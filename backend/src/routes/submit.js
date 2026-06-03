
const express = require('express');
const submitRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const createRateLimiter = require("../middleware/rateLimiter");
const idempotency = require("../middleware/idempotency");
const {submitCode,runCode} = require("../controllers/userSubmission");

// Per-user limits to protect the Judge0 quota. Runs after userMiddleware (needs req.result).
const submitLimiter = createRateLimiter({ windowMs: 60_000, max: 10, keyPrefix: "rl:submit" });
const runLimiter = createRateLimiter({ windowMs: 60_000, max: 20, keyPrefix: "rl:run" });

submitRouter.post("/submit/:id", userMiddleware, submitLimiter, idempotency, submitCode);
submitRouter.post("/run/:id", userMiddleware, runLimiter, runCode);

module.exports = submitRouter;
