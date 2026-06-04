const { Server } = require("socket.io");
const { QueueEvents } = require("bullmq");
const connection = require("./config/bull.config");
const { submissionQueue, SUBMISSION_QUEUE } = require("./queues/submissionQueue");
const allowedOrigins = require("./config/origins.config");

let io;

/**
 * Real-time layer.
 *
 * 1. Browsers connect and `join` a room named after their userId.
 * 2. The submission worker (possibly a different process) finishes a job; BullMQ
 *    QueueEvents notifies us here, and we push the verdict to that user's room.
 *
 * This is the producer/consumer result travelling back to the user without polling.
 */
function initSocket(server) {
  io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  io.on("connection", (socket) => {
    socket.on("join", (userId) => {
      if (userId) socket.join(userId.toString());
    });
  });

  const queueEvents = new QueueEvents(SUBMISSION_QUEUE, { connection });

  queueEvents.on("completed", ({ returnvalue }) => {
    let result = returnvalue;
    if (typeof result === "string") {
      try { result = JSON.parse(result); } catch { return; }
    }
    if (result && result.userId) {
      io.to(result.userId).emit("submission:result", result);
    }
  });

  // A job that exhausted its retries (e.g. Judge0 down / circuit breaker open).
  // Notify the user so the UI stops "judging" instead of hanging forever.
  queueEvents.on("failed", async ({ jobId, failedReason }) => {
    console.error("Submission job failed:", jobId, failedReason);
    try {
      const job = await submissionQueue.getJob(jobId);
      const userId = job?.data?.userId;
      if (!userId || !io) return;

      const breakerOpen = /breaker is open/i.test(failedReason || "");
      io.to(userId).emit("submission:result", {
        submissionId: jobId,
        userId,
        accepted: false,
        status: "error",
        error: breakerOpen
          ? "Judge is temporarily unavailable. Please try again in a moment."
          : "Evaluation failed. Please try again.",
        passedTestCases: 0,
        totalTestCases: 0,
      });
    } catch (e) {
      console.error("failed-notify error:", e.message);
    }
  });

  return io;
}

module.exports = { initSocket, getIO: () => io };
