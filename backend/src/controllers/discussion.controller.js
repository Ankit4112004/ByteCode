const Discussion = require("../models/discussion.model");
const Problem = require("../models/problem.model");

// Shape a comment for the client: expose author name, upvote count, and whether
// the current user has upvoted — without leaking the full upvotes array.
const shape = (doc, userId) => ({
  _id: doc._id,
  text: doc.text,
  parentId: doc.parentId,
  problemId: doc.problemId,
  author: doc.userId ? { _id: doc.userId._id, firstName: doc.userId.firstName } : null,
  upvoteCount: doc.upvotes.length,
  upvoted: doc.upvotes.some((u) => u.toString() === userId.toString()),
  createdAt: doc.createdAt,
});

// GET /discussion/problem/:problemId — all comments for a problem (flat; client nests by parentId)
const getDiscussions = async (req, res) => {
  try {
    const { problemId } = req.params;

    const comments = await Discussion.find({ problemId })
      .populate("userId", "firstName")
      .sort({ createdAt: 1 });

    res.status(200).json(comments.map((c) => shape(c, req.result._id)));
  } catch (err) {
    res.status(500).json({ error: "Failed to load discussions" });
  }
};

// POST /discussion/problem/:problemId — create a top-level comment
const createDiscussion = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) return res.status(400).json({ error: "Text is required" });

    const problem = await Problem.findById(problemId).select("_id");
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const comment = await Discussion.create({
      problemId,
      userId: req.result._id,
      text: text.trim(),
    });

    await comment.populate("userId", "firstName");
    res.status(201).json(shape(comment, req.result._id));
  } catch (err) {
    res.status(500).json({ error: "Failed to post comment" });
  }
};

// POST /discussion/:commentId/reply — reply to an existing comment
const replyToDiscussion = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) return res.status(400).json({ error: "Text is required" });

    const parent = await Discussion.findById(commentId);
    if (!parent) return res.status(404).json({ error: "Comment not found" });

    const reply = await Discussion.create({
      problemId: parent.problemId,
      userId: req.result._id,
      text: text.trim(),
      parentId: parent._id,
    });

    await reply.populate("userId", "firstName");
    res.status(201).json(shape(reply, req.result._id));
  } catch (err) {
    res.status(500).json({ error: "Failed to post reply" });
  }
};

// POST /discussion/:commentId/upvote — toggle the current user's upvote
const toggleUpvote = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.result._id;

    const comment = await Discussion.findById(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const already = comment.upvotes.some((u) => u.toString() === userId.toString());

    // Atomic toggle so concurrent clicks can't double-add/remove.
    await Discussion.findByIdAndUpdate(
      commentId,
      already ? { $pull: { upvotes: userId } } : { $addToSet: { upvotes: userId } }
    );

    res.status(200).json({ upvoted: !already });
  } catch (err) {
    res.status(500).json({ error: "Failed to update upvote" });
  }
};

// DELETE /discussion/:commentId — author or admin only; removes the comment and its replies
const deleteDiscussion = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Discussion.findById(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const isAuthor = comment.userId.toString() === req.result._id.toString();
    const isAdmin = req.result.role === "admin";
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // Remove the comment and any replies to it.
    await Discussion.deleteMany({ $or: [{ _id: commentId }, { parentId: commentId }] });

    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

module.exports = {
  getDiscussions,
  createDiscussion,
  replyToDiscussion,
  toggleUpvote,
  deleteDiscussion,
};
