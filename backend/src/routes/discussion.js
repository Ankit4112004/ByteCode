const express = require('express');
const discussionRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const {
  getDiscussions,
  createDiscussion,
  replyToDiscussion,
  toggleUpvote,
  deleteDiscussion,
} = require("../controllers/discussion");

// All discussion actions require a logged-in user.
discussionRouter.get("/problem/:problemId", userMiddleware, getDiscussions);
discussionRouter.post("/problem/:problemId", userMiddleware, createDiscussion);
discussionRouter.post("/:commentId/reply", userMiddleware, replyToDiscussion);
discussionRouter.post("/:commentId/upvote", userMiddleware, toggleUpvote);
discussionRouter.delete("/:commentId", userMiddleware, deleteDiscussion);

module.exports = discussionRouter;
