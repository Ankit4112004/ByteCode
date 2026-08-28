const IORedis = require("ioredis");

//  `maxRetriesPerRequest: null` is required by BullMQ.

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on("error", (err) => console.error("BullMQ Redis error:", err.message));

module.exports = connection;
