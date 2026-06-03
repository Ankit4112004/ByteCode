/**
 * Web server entry point for the persistent host (Railway/Render).
 * Real HTTP server + Socket.io. Run the worker separately (npm run worker).
 *
 * (Vercel serverless still uses server.js, which has no websockets.)
 */
require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const redisClient = require("./config/redis");
const { initSocket } = require("./socket");

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB(); // MongoDB is required

    // Redis is optional (cache / rate-limit / blocklist) — don't crash without it.
    if (!redisClient.isOpen) {
      try {
        await redisClient.connect();
      } catch (err) {
        console.error("Redis connect failed (continuing without it):", err.message);
      }
    }

    server.listen(PORT, () => console.log("Server listening on port " + PORT));
  } catch (err) {
    console.error("Startup failed:", err.message);
  }
})();
