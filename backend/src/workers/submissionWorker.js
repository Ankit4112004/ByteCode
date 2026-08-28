const { Worker, UnrecoverableError } = require("bullmq");
const connection = require("../config/bull.config");
const { SUBMISSION_QUEUE } = require("../queues/submissionQueue");
const { processSubmission } = require("../services/submissionService");


const createSubmissionWorker = () => {
  const worker = new Worker(
    SUBMISSION_QUEUE,
    async (job) => {
      const { submissionId } = job.data;
      try {
        return await processSubmission(submissionId);
      } catch (err) {
        // No point retrying when the judge circuit breaker is open — fail
        // immediately so the user gets feedback in <1s instead of after backoff.
        if (/breaker is open/i.test(err.message || "")) {
          throw new UnrecoverableError(err.message);
        }
        throw err;
      }
    },
    { connection, concurrency: 5 }
  );

  worker.on("completed", (job) => {
    console.log(`Submission ${job.id} evaluated`);
  });
  worker.on("failed", (job, err) => {
    console.error(`Submission ${job?.id} failed:`, err.message);
  });

  return worker;
};

module.exports = { createSubmissionWorker };
