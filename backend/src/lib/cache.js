const redisClient = require("../config/redis.config");


  
  


const cacheGet = async (key) => {
  try {
    if (!redisClient.isOpen) return null;
    const val = await redisClient.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.error("cacheGet failed:", err.message);
    return null;
  }
};

const cacheSet = async (key, value, ttlSeconds = 300) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error("cacheSet failed:", err.message);
  }
};

const cacheDel = async (...keys) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.del(keys);
  } catch (err) {
    console.error("cacheDel failed:", err.message);
  }
};

module.exports = { cacheGet, cacheSet, cacheDel };
