const { Server } = require("socket.io");
const { QueueEvents } = require("bullmq");
const connection = require("./config/bullConnection");
const { SUBMISSION_QUEUE } = require("./queues/submissionQueue");
const allowedOrigins = require("./config/origins");

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

  queueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error("Submission job failed:", jobId, failedReason);
  });

  return io;
}

module.exports = { initSocket, getIO: () => io };
