const IORedis = require("ioredis");

/**
 * BullMQ requires an ioredis connection (separate from the node-redis client we
 * use elsewhere). `maxRetriesPerRequest: null` is required by BullMQ.
 */
const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USER || "default",
  password: process.env.REDIS_PASS,
  maxRetriesPerRequest: null,
});

connection.on("error", (err) => console.error("BullMQ Redis error:", err.message));

module.exports = connection;
