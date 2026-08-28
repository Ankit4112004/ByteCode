const Problem = require("../models/problem.model");
const Submission = require("../models/submission.model");
const { evaluateTestcases } = require("../services/evaluation");
const { enqueueSubmission } = require("../queues/submissionQueue");
const { cacheDel } = require("../lib/cache");


const submitCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;
    let { code, language } = req.body;

    if (!userId || !code || !problemId || !language)
      return res.status(400).send("Some field missing");

    if (language === "cpp") language = "c++";

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).send("Problem not found");

    const submission = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status: "pending",
      testCasesTotal: problem.hiddenTestCases.length,
    });


    await cacheDel("problems:all", `problem:${problemId}`);

    await enqueueSubmission({
      submissionId: submission._id.toString(),
      userId: userId.toString(),
    });

    return res.status(202).json({
      submissionId: submission._id,
      status: "pending",
      message: "Submission queued. Result will arrive shortly.",
    });
  } catch (err) {
    res.status(500).send("Internal Server Error " + err);
  }
};

  // Run against visible test cases — kept synchronous (fast, no persistence).
 
const runCode = async (req, res) => {
  try {
    const problemId = req.params.id;
    let { code, language } = req.body;

    if (!code || !problemId || !language)
      return res.status(400).send("Some field missing");

    if (language === "cpp") language = "c++";

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).send("Problem not found");

    const verdict = await evaluateTestcases(code, language, problem.visibleTestCases);

    res.status(201).json({
      success: verdict.status === "accepted",
      testCases: verdict.results,
      runtime: verdict.runtime,
      memory: verdict.memory,
    });
  } catch (err) {
    const breakerOpen = /breaker is open/i.test(err.message || "");
    res.status(breakerOpen ? 503 : 500).json({
      success: false,
      error: breakerOpen
        ? "Judge is temporarily unavailable. Please try again in a moment."
        : "Could not run your code. Please try again.",
    });
  }
};

/** Poll a single submission's status (fallback if the websocket push is missed). */
const getSubmissionStatus = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.submissionId,
      userId: req.result._id,
    });
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    res.status(200).json({
      submissionId: submission._id,
      status: submission.status,
      accepted: submission.status === "accepted",
      passedTestCases: submission.testCasesPassed,
      totalTestCases: submission.testCasesTotal,
      runtime: submission.runtime,
      memory: submission.memory,
      errorMessage: submission.errorMessage,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch submission" });
  }
};

/** Fetch all submissions globally for the Status page with pagination. */
module.exports = { submitCode, runCode, getSubmissionStatus };
