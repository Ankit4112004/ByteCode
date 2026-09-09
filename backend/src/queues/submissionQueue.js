const { Queue } = require("bullmq");
const connection = require("../config/bull.config");

const SUBMISSION_QUEUE = "submissions";


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
