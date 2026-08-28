
require("dotenv").config();

const connectDB = require("../config/db.config");
const redisClient = require("../config/redis.config");
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
