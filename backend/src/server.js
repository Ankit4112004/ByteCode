const app = require("./app");
const connectDB = require("./config/db");
const redisClient = require("./config/redis");

let readyPromise;

if (!readyPromise) {
  readyPromise = (async () => {
    await connectDB();

    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    console.log("DB & Redis connected");
  })();
}

module.exports = async (req, res) => {
  await readyPromise; // ⬅️ BLOCK until DB ready
  return app(req, res);
};
