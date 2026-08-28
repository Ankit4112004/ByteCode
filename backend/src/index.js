
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


(async () => {
  try {
    await connectDB();


    if (!redisClient.isOpen) {
      try {
        await redisClient.connect();
      } catch (err) {
        console.error("Redis connect failed (continuing without it):", err.message);
      }
    }

    server.listen(PORT, () => console.log("Server listening on port " + PORT));

    if (process.env.RUN_WORKER_IN_PROCESS === "true") {
      createSubmissionWorker();
      console.log("Submission worker running in-process (concurrency: 5)");
    }

  } catch (err) {
    console.error("Startup failed:", err.message);
  }
})();
