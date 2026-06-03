const redisClient = require("../config/redis");

/**
 * Leaderboards backed by Redis Sorted Sets (ZSET) — O(log N) ranked writes/reads.
 *
 *  - global:        leaderboard:global         member=userId  score=weighted solves
 *  - per-problem:   leaderboard:problem:<pid>  member=userId  score=best runtime (ms)
 *
 * All calls are fail-safe (return a fallback if Redis is down).
 */

const GLOBAL = "leaderboard:global";
const problemKey = (pid) => `leaderboard:problem:${pid}`;
const WEIGHT = { easy: 1, medium: 2, hard: 3 };

const safe = async (fn, fallback) => {
  try {
    if (!redisClient.isOpen) return fallback;
    return await fn();
  } catch (err) {
    console.error("leaderboard error:", err.message);
    return fallback;
  }
};

// [member, score, member, score, ...] -> [{ userId, score }]
const parseFlat = (flat) => {
  const out = [];
  for (let i = 0; i < flat.length; i += 2) {
    out.push({ userId: flat[i], score: Number(flat[i + 1]) });
  }
  return out;
};

// Add weighted points for an accepted solve (idempotent solves handled by caller).
const addSolve = (userId, difficulty) =>
  safe(() => redisClient.zIncrBy(GLOBAL, WEIGHT[difficulty] || 1, userId.toString()));

// Record best (fastest) runtime for a problem. ZADD LT keeps the minimum score.
const recordBestRuntime = (problemId, userId, runtimeSeconds) =>
  safe(() => {
    const ms = Math.round((runtimeSeconds || 0) * 1000);
    return redisClient.sendCommand(["ZADD", problemKey(problemId), "LT", String(ms), userId.toString()]);
  });

const getGlobalTop = (n = 50) =>
  safe(async () => {
    const flat = await redisClient.sendCommand(["ZREVRANGE", GLOBAL, "0", String(n - 1), "WITHSCORES"]);
    return parseFlat(flat || []);
  }, []);

const getProblemTop = (problemId, n = 50) =>
  safe(async () => {
    // ascending = fastest first
    const flat = await redisClient.sendCommand(["ZRANGE", problemKey(problemId), "0", String(n - 1), "WITHSCORES"]);
    return parseFlat(flat || []);
  }, []);

// 0-based rank (null if not ranked), score, and total participants.
const getGlobalStanding = (userId) =>
  safe(async () => {
    const id = userId.toString();
    const rank = await redisClient.sendCommand(["ZREVRANK", GLOBAL, id]);
    const score = await redisClient.sendCommand(["ZSCORE", GLOBAL, id]);
    const total = await redisClient.zCard(GLOBAL);
    return {
      rank: rank === null || rank === undefined ? null : Number(rank),
      score: score ? Number(score) : 0,
      total: Number(total) || 0,
    };
  }, { rank: null, score: 0, total: 0 });

module.exports = {
  addSolve,
  recordBestRuntime,
  getGlobalTop,
  getProblemTop,
  getGlobalStanding,
};
