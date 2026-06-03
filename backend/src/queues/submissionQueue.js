const { Queue } = require("bullmq");
const connection = require("../config/bullConnection");

const SUBMISSION_QUEUE = "submissions";

/**
 * Producer side of the async pipeline. The /submit controller adds a job here and
 * returns 202 immediately; the worker (workers/submissionWorker.js) consumes it.
 *
 * Jobs retry 3x with exponential backoff; failures are kept so they can be
 * inspected (a simple dead-letter equivalent).
 */
const submissionQueue = new Queue(SUBMISSION_QUEUE, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: false,
  },
});

const enqueueSubmission = (payload) =>
  submissionQueue.add("evaluate", payload, { jobId: payload.submissionId });

module.exports = { submissionQueue, enqueueSubmission, SUBMISSION_QUEUE };
