import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosClient from "../utils/axiosClient";

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const Discussion = ({ problemId }) => {
  const user = useSelector((s) => s.auth.user);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);

  const load = async () => {
    try {
      const { data } = await axiosClient.get(`/discussion/problem/${problemId}`);
      setComments(data);
    } catch (err) {
      console.error("Failed to load discussions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [problemId]);

  const postComment = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await axiosClient.post(`/discussion/problem/${problemId}`, { text });
      setText("");
      await load();
    } catch (err) {
      console.error("Failed to post", err);
    } finally {
      setPosting(false);
    }
  };

  const postReply = async (commentId) => {
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      await axiosClient.post(`/discussion/${commentId}/reply`, { text: replyText });
      setReplyText("");
      setReplyTo(null);
      await load();
    } catch (err) {
      console.error("Failed to reply", err);
    } finally {
      setPosting(false);
    }
  };

  const toggleUpvote = async (commentId) => {
    // optimistic update
    setComments((prev) =>
      prev.map((c) =>
        c._id === commentId
          ? { ...c, upvoted: !c.upvoted, upvoteCount: c.upvoteCount + (c.upvoted ? -1 : 1) }
          : c
      )
    );
    try {
      await axiosClient.post(`/discussion/${commentId}/upvote`);
    } catch (err) {
      console.error("Failed to upvote", err);
      load(); // revert by reloading on error
    }
  };

  const remove = async (commentId) => {
    try {
      await axiosClient.delete(`/discussion/${commentId}`);
      await load();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const canDelete = (c) =>
    user && (user._id === c.author?._id || user.role === "admin");

  const topLevel = comments.filter((c) => !c.parentId);
  const repliesOf = (id) => comments.filter((c) => c.parentId === id);

  const CommentCard = ({ c, isReply }) => (
    <div className={`bg-base-200 rounded-lg p-3 ${isReply ? "ml-8 mt-2" : ""}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">{c.author?.firstName || "User"}</span>
        <span className="text-xs text-gray-500">{timeAgo(c.createdAt)}</span>
      </div>
      <p className="text-sm whitespace-pre-wrap mb-2">{c.text}</p>
      <div className="flex items-center gap-3 text-xs">
        <button
          className={`flex items-center gap-1 ${c.upvoted ? "text-primary" : "text-gray-500"}`}
          onClick={() => toggleUpvote(c._id)}
        >
          ▲ {c.upvoteCount}
        </button>
        {!isReply && (
          <button
            className="text-gray-500 hover:text-primary"
            onClick={() => {
              setReplyTo(replyTo === c._id ? null : c._id);
              setReplyText("");
            }}
          >
            Reply
          </button>
        )}
        {canDelete(c) && (
          <button className="text-gray-500 hover:text-error" onClick={() => remove(c._id)}>
            Delete
          </button>
        )}
      </div>

      {replyTo === c._id && (
        <div className="mt-2 flex gap-2">
          <input
            className="input input-sm input-bordered flex-1"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && postReply(c._id)}
          />
          <button className="btn btn-sm btn-primary" disabled={posting} onClick={() => postReply(c._id)}>
            Reply
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Discussion</h2>

      {/* New comment box */}
      <div className="flex gap-2 mb-6">
        <textarea
          className="textarea textarea-bordered flex-1"
          rows={2}
          placeholder="Share your approach or ask a question..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary" disabled={posting || !text.trim()} onClick={postComment}>
          Post
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner"></span>
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-gray-500 text-sm">No comments yet. Be the first to start the discussion!</p>
      ) : (
        <div className="space-y-4">
          {topLevel.map((c) => (
            <div key={c._id}>
              <CommentCard c={c} isReply={false} />
              {repliesOf(c._id).map((r) => (
                <CommentCard key={r._id} c={r} isReply={true} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Discussion;
