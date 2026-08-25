
const express = require('express');
const submitRouter = express.Router();
const userMiddleware = require("../middleware/user.middleware");
const createRateLimiter = require("../middleware/rateLimiter.middleware");

const {submitCode,runCode,getSubmissionStatus,getAllSubmissions} = require("../controllers/submission.controller");

// Per-user limits to protect the Judge0 quota. Runs after userMiddleware (needs req.result).
const submitLimiter = createRateLimiter({ windowMs: 60_000, max: 10, keyPrefix: "rl:submit" });
const runLimiter = createRateLimiter({ windowMs: 60_000, max: 20, keyPrefix: "rl:run" });

submitRouter.post("/submit/:id", userMiddleware, submitLimiter, submitCode);
submitRouter.post("/run/:id", userMiddleware, runLimiter, runCode);
submitRouter.get("/status/:submissionId", userMiddleware, getSubmissionStatus);
submitRouter.get("/all", getAllSubmissions);

module.exports = submitRouter;
