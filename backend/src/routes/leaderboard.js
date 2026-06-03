const express = require("express");
const leaderboardRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const { getGlobal, getMe, getProblemBoard } = require("../controllers/leaderboard");

leaderboardRouter.get("/", userMiddleware, getGlobal);
leaderboardRouter.get("/me", userMiddleware, getMe);
leaderboardRouter.get("/problem/:problemId", userMiddleware, getProblemBoard);

module.exports = leaderboardRouter;
