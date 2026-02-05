const app = require("./app");
const main = require("./config/db");
const redisClient = require("./config/redis");

let connected = false;

async function connectOnce() {
  if (connected) return;

  try {
    await main();

    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    connected = true;
    console.log("DB & Redis connected");
  } catch (err) {
    console.error("Startup error:", err);
  }
}

connectOnce(); // ✅ run once per cold start

module.exports = app;
