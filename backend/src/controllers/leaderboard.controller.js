const User = require("../models/user.model");
const leaderboard = require("../lib/leaderboard");

// Resolve userIds -> firstName in one query, preserving leaderboard order.
const attachNames = async (entries) => {
  const ids = entries.map((e) => e.userId);
  const users = await User.find({ _id: { $in: ids } }).select("firstName");
  const nameById = new Map(users.map((u) => [u._id.toString(), u.firstName]));
  return entries.map((e, i) => ({
    rank: i + 1,
    userId: e.userId,
    firstName: nameById.get(e.userId) || "User",
    score: e.score,
  }));
};

// GET /leaderboard — global top 50
const getGlobal = async (req, res) => {
  try {
    const top = await leaderboard.getGlobalTop(50);
    res.status(200).json(await attachNames(top));
  } catch (err) {
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
};

// GET /leaderboard/me — the current user's rank card
const getMe = async (req, res) => {
  try {
    const { rank, score, total } = await leaderboard.getGlobalStanding(req.result._id);
    const rank1 = rank === null ? null : rank + 1; // 1-based for display
    const percentile =
      rank === null || total === 0 ? null : Math.round(((total - rank) / total) * 100);
    res.status(200).json({
      rank: rank1,
      score,
      total,
      percentile,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load your standing" });
  }
};

// GET /leaderboard/problem/:problemId — fastest solutions for one problem
const getProblemBoard = async (req, res) => {
  try {
    const top = await leaderboard.getProblemTop(req.params.problemId, 50);
    const ids = top.map((e) => e.userId);
    const users = await User.find({ _id: { $in: ids } }).select("firstName");
    const nameById = new Map(users.map((u) => [u._id.toString(), u.firstName]));
    res.status(200).json(
      top.map((e, i) => ({
        rank: i + 1,
        firstName: nameById.get(e.userId) || "User",
        runtimeMs: e.score, // best runtime in ms
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to load problem leaderboard" });
  }
};

module.exports = { getGlobal, getMe, getProblemBoard };
