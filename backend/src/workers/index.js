/**
 * Standalone worker process. Run alongside the web server:
 *   node src/workers/index.js   (or: npm run worker)
 *
 * On the persistent host (Railway/Render) this is a second service from the same
 * repo, scaled independently of the API.
 */
require("dotenv").config();

const connectDB = require("../config/db");
const redisClient = require("../config/redis");
const { createSubmissionWorker } = require("./submissionWorker");

(async () => {
  try {
    await connectDB();

    if (!redisClient.isOpen) {
      try {
        await redisClient.connect();
      } catch (err) {
        console.error("Redis connect failed in worker:", err.message);
      }
    }

    createSubmissionWorker();
    console.log("Submission worker started (concurrency: 5)");
  } catch (err) {
    console.error("Worker failed to start:", err.message);
    process.exit(1);
  }
})();
