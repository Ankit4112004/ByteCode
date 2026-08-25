const Submission = require("../models/submission.model");
const Problem = require("../models/problem.model");
const User = require("../models/user.model");
const { evaluateTestcases } = require("./evaluation");
const leaderboard = require("../lib/leaderboard");

/**
 * Runs a pending submission to completion. Called by the BullMQ worker.
 *
 * Saga-style: each step has a compensating action. If evaluation or persistence
 * fails partway, we mark the submission as a system error instead of leaving it
 * stuck on 'pending', then rethrow so BullMQ can apply its retry policy.
 */
async function processSubmission(submissionId) {
  const submission = await Submission.findById(submissionId);
  if (!submission) throw new Error(`Submission ${submissionId} not found`);

  const problem = await Problem.findById(submission.problemId);
  if (!problem) throw new Error(`Problem ${submission.problemId} not found`);

  try {
    // Step 1: evaluate against hidden test cases (Template Method)
    const verdict = await evaluateTestcases(
      submission.code,
      submission.language,
      problem.hiddenTestCases
    );

    // Step 2: persist the verdict
    submission.status = verdict.status;
    submission.testCasesPassed = verdict.testCasesPassed;
    submission.testCasesTotal = verdict.testCasesTotal;
    submission.runtime = verdict.runtime;
    submission.memory = verdict.memory;
    submission.errorMessage = verdict.errorMessage;
    await submission.save();

    // Step 3: on accept, mark solved + update global leaderboard (no double-counting)
    if (verdict.status === "accepted") {
      const user = await User.findById(submission.userId).select("problemSolved");
      const alreadySolved = user?.problemSolved?.some(
        (p) => p.toString() === submission.problemId.toString()
      );

      if (!alreadySolved) {
        await User.findByIdAndUpdate(submission.userId, {
          $addToSet: { problemSolved: submission.problemId },
        });
        await leaderboard.addSolve(submission.userId, problem.difficulty);
      }
    }

    return buildResult(submission, verdict);
  } catch (err) {
    // Compensating action: don't leave it 'pending'
    submission.status = "error";
    submission.errorMessage = "Evaluation failed: " + err.message;
    await submission.save().catch(() => {});
    throw err;
  }
}

const buildResult = (submission, verdict) => ({
  submissionId: submission._id.toString(),
  userId: submission.userId.toString(),
  problemId: submission.problemId.toString(),
  accepted: verdict.status === "accepted",
  status: verdict.status,
  passedTestCases: verdict.testCasesPassed,
  totalTestCases: verdict.testCasesTotal,
  runtime: verdict.runtime,
  memory: verdict.memory,
  errorMessage: verdict.errorMessage,
});

module.exports = { processSubmission };
