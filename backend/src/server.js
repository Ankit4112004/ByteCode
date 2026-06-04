const app = require("./app");
const connectDB = require("./config/db.config");
const redisClient = require("./config/redis.config");

let readyPromise;

if (!readyPromise) {
  readyPromise = (async () => {
    await connectDB(); // MongoDB is required — fail loudly if it's down

    // Redis is optional (only used for the logout blocklist). Don't let a
    // Redis outage take the whole API down.
    if (!redisClient.isOpen) {
      try {
        await redisClient.connect();
        console.log("Redis connected");
      } catch (err) {
        console.error("Redis connect failed (continuing without it):", err.message);
      }
    }

    console.log("DB ready");
  })();
}

module.exports = async (req, res) => {
  await readyPromise; // ⬅️ BLOCK until DB ready
  return app(req, res);
};
