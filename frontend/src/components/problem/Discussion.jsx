import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosClient from "../../utils/axiosClient";
import { MessageSquare, Send, ThumbsUp, Trash2, Reply } from "lucide-react";

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
    <div className={`group flex gap-4 ${isReply ? "ml-12 mt-4 relative" : "mt-8"}`}>
      {isReply && (
        <>
          <div className="absolute -left-7 top-0 bottom-0 w-px bg-base-300"></div>
          <div className="absolute -left-7 top-4 w-5 h-px bg-base-300"></div>
        </>
      )}
      
      {/* Avatar */}
      <div className={`shrink-0 flex items-center justify-center font-bold text-primary rounded-full bg-primary/10 ${isReply ? "w-8 h-8 text-sm" : "w-10 h-10 text-base"}`}>
        {c.author?.firstName?.[0]?.toUpperCase() || "U"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-base-content">{c.author?.firstName || "User"}</span>
          <span className="text-xs text-base-content/50">• {timeAgo(c.createdAt)}</span>
        </div>
        <p className="text-sm text-base-content/90 whitespace-pre-wrap mb-2.5 leading-relaxed break-words">{c.text}</p>
        
        {/* Actions */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            className={`flex items-center gap-1.5 transition-colors ${c.upvoted ? "text-primary" : "text-base-content/50 hover:text-base-content/80"}`}
            onClick={() => toggleUpvote(c._id)}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${c.upvoted ? "fill-primary" : ""}`} />
            {c.upvoteCount > 0 ? c.upvoteCount : "Upvote"}
          </button>
          
          {!isReply && (
            <button
              className="flex items-center gap-1.5 text-base-content/50 hover:text-base-content/80 transition-colors"
              onClick={() => {
                setReplyTo(replyTo === c._id ? null : c._id);
                setReplyText("");
              }}
            >
              <Reply className="w-3.5 h-3.5" />
              Reply
            </button>
          )}
          
          {canDelete(c) && (
            <button className="flex items-center gap-1.5 text-base-content/50 hover:text-error transition-colors opacity-0 group-hover:opacity-100" onClick={() => remove(c._id)}>
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>

        {/* Reply Input */}
        {replyTo === c._id && (
          <div className="mt-4 flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
              {user?.firstName?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 relative">
              <input
                className="w-full bg-base-200 border border-base-300 text-base-content text-sm rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:border-primary transition-colors"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && postReply(c._id)}
                autoFocus
              />
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-base-content/50 hover:text-primary transition-colors disabled:opacity-50"
                disabled={posting || !replyText.trim()} 
                onClick={() => postReply(c._id)}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 bg-transparent text-base-content overflow-hidden">
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-base-content">Discussion</h2>
      </div>

      {/* New comment box */}
      <div className="flex gap-4 mb-8 shrink-0">
        <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-base text-primary">
          {user?.firstName?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 bg-base-100 border border-base-300 rounded-xl overflow-hidden focus-within:border-primary transition-colors shadow-sm">
          <textarea
            className="w-full bg-transparent p-3 text-sm text-base-content placeholder-base-content/50 resize-none focus:outline-none"
            rows={3}
            placeholder="Share your approach or ask a question..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="bg-base-200/50 px-3 py-2 border-t border-base-300 flex justify-end">
            <button 
              className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={posting || !text.trim()} 
              onClick={postComment}
            >
              <Send className="w-3.5 h-3.5" />
              Post
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner text-primary"></span>
          </div>
        ) : topLevel.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center opacity-70">
            <MessageSquare className="w-12 h-12 text-base-content/40 mb-3" />
            <p className="text-base-content/80 font-medium">No comments yet.</p>
            <p className="text-base-content/50 text-sm mt-1">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="pb-10">
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
    </div>
  );
};

export default Discussion;
