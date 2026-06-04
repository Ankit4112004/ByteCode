/**
 * Web server entry point for the persistent host (Railway/Render).
 * Real HTTP server + Socket.io. Run the worker separately (npm run worker).
 *
 * (Vercel serverless still uses server.js, which has no websockets.)
 */
require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db.config");
const redisClient = require("./config/redis.config");
const { initSocket } = require("./socket");
const { createSubmissionWorker } = require("./workers/submissionWorker");

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3000;

// Ping our own /health before the host's idle timeout so a free web service
// never spins down (which would also sleep the in-process worker). Render sets
// RENDER_EXTERNAL_URL; you can also set KEEP_ALIVE_URL manually on other hosts.
//
// Only during active hours (08:30–21:30 IST). Outside that window we skip the
// ping so the service is free to sleep overnight (saves free instance-hours).
// The GitHub Actions cron wakes it again at 08:30 IST.
function isWithinActiveHoursIST() {
  const now = new Date();
  const istMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440; // UTC+5:30
  return istMinutes >= 510 && istMinutes <= 1290; // 08:30 .. 21:30
}

function startKeepAlive() {
  const base = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL;
  if (!base) return; // local dev / hosts that don't sleep — do nothing
  const url = base.replace(/\/$/, "") + "/health";
  const EVERY_MS = 14 * 60 * 1000; // just under Render's ~15 min idle window
  setInterval(() => {
    if (!isWithinActiveHoursIST()) return; // let it sleep outside active hours
    fetch(url).catch((err) => console.error("Keep-alive ping failed:", err.message));
  }, EVERY_MS).unref(); // don't keep the event loop alive just for this
  console.log("Keep-alive ping enabled → " + url + " (08:30–21:30 IST, every 14 min)");
}

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

    // Single-process mode (free hosting): run the BullMQ worker inside the web
    // process. For scale, leave this unset and run `npm run worker` separately.
    if (process.env.RUN_WORKER_IN_PROCESS === "true") {
      createSubmissionWorker();
      console.log("Submission worker running in-process (concurrency: 5)");
    }

    // Keep-alive: free hosts (Render) spin the service down after ~15 min of no
    // inbound traffic — which would also sleep the in-process worker. Render
    // injects RENDER_EXTERNAL_URL automatically, so we ping our own /health every
    // 14 min to stay awake. No-op locally (the env var is only set on Render).
    startKeepAlive();
  } catch (err) {
    console.error("Startup failed:", err.message);
  }
})();
