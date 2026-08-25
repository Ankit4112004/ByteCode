const express = require("express");
const leaderboardRouter = express.Router();
const userMiddleware = require("../middleware/user.middleware");
const { getGlobal, getMe } = require("../controllers/leaderboard.controller");

leaderboardRouter.get("/", userMiddleware, getGlobal);
leaderboardRouter.get("/me", userMiddleware, getMe);

module.exports = leaderboardRouter;
