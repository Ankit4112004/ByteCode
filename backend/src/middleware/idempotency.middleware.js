const redisClient = require("../config/redis.config");

/**
 * Idempotency middleware.
 *
 * The client sends a unique `Idempotency-Key` header per action. If we've already
 * processed that key, we replay the stored response instead of running the handler
 * again — so a double-click / network retry can't create duplicate submissions or
 * fire duplicate Judge0 calls.
 *
 * Fail-open: if Redis is unavailable or no key is sent, the request proceeds normally.
 */
const IDEMPOTENCY_TTL = 60 * 60 * 24; // 24h

const idempotency = async (req, res, next) => {
  const key = req.headers["idempotency-key"];
  if (!key) return next();

  const redisKey = `idemp:${key}`;

  try {
    if (redisClient.isOpen) {
      const cached = await redisClient.get(redisKey);
      if (cached) {
        const { statusCode, body } = JSON.parse(cached);
        return res.status(statusCode).json(body);
      }
    }
  } catch (err) {
    console.error("idempotency read failed (continuing):", err.message);
  }

  // Wrap res.json to store the response on success.
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300 && redisClient.isOpen) {
      redisClient
        .setEx(redisKey, IDEMPOTENCY_TTL, JSON.stringify({ statusCode: res.statusCode, body }))
        .catch((err) => console.error("idempotency write failed:", err.message));
    }
    return originalJson(body);
  };

  next();
};

module.exports = idempotency;
