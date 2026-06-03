const redisClient = require("../config/redis");

/**
 * Sliding-window rate limiter (factory pattern).
 *
 * Uses a Redis sorted set per key: each request is a member scored by timestamp.
 * We drop entries older than the window, count what's left, and reject if over
 * the limit. This is a true sliding window (no burst-at-boundary like fixed window).
 *
 *   createRateLimiter({ windowMs, max, keyPrefix, by })
 *     by: 'user' (default, needs auth middleware first) or 'ip'
 *
 * Fail-open: if Redis errors, the request is allowed (availability > strictness).
 */
const createRateLimiter = ({ windowMs = 60_000, max = 10, keyPrefix = "rl", by = "user" } = {}) =>
  async (req, res, next) => {
    try {
      if (!redisClient.isOpen) return next(); // no Redis → don't block

      const id = by === "ip"
        ? (req.ip || req.headers["x-forwarded-for"] || "unknown")
        : (req.result?._id?.toString() || req.ip || "anon");

      const key = `${keyPrefix}:${id}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // remove old entries, add this request, count, set TTL — pipelined
      const multi = redisClient.multi();
      multi.zRemRangeByScore(key, 0, windowStart);
      multi.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
      multi.zCard(key);
      multi.expire(key, Math.ceil(windowMs / 1000));
      const results = await multi.exec();

      const count = results[2]; // zCard result

      if (count > max) {
        res.set("Retry-After", Math.ceil(windowMs / 1000));
        return res.status(429).json({
          error: "Too many requests. Please slow down.",
        });
      }

      next();
    } catch (err) {
      console.error("rateLimiter error (allowing request):", err.message);
      next();
    }
  };

module.exports = createRateLimiter;
