import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../../utils/axiosClient";
import { Send, Bot, User, Sparkles, Loader2, Copy, Check } from "lucide-react";

/* ─── Markdown-lite renderer ────────────────────────────────────────────── */
const renderMarkdown = (text) => {
  if (!text) return null;

  // Split into lines and process
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks (```)
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <div key={elements.length} className="chat-code-block">
          {lang && <div className="chat-code-lang">{lang}</div>}
          <pre><code>{codeLines.join("\n")}</code></pre>
        </div>
      );
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      elements.push(<h4 key={elements.length} className="chat-md-h4">{renderInlineMarkdown(line.slice(4))}</h4>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h3 key={elements.length} className="chat-md-h3">{renderInlineMarkdown(line.slice(3))}</h3>);
      i++; continue;
    }
    if (line.startsWith("# ")) {
      elements.push(<h2 key={elements.length} className="chat-md-h2">{renderInlineMarkdown(line.slice(2))}</h2>);
      i++; continue;
    }

    // Bullet points
    if (line.match(/^\s*[-*]\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\s*[-*]\s/)) {
        items.push(lines[i].replace(/^\s*[-*]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={elements.length} className="chat-md-ul">
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered lists
    if (line.match(/^\s*\d+\.\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s/)) {
        items.push(lines[i].replace(/^\s*\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={elements.length} className="chat-md-ol">
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty lines
    if (line.trim() === "") {
      elements.push(<div key={elements.length} className="h-2" />);
      i++; continue;
    }

    // Normal paragraph
    elements.push(<p key={elements.length} className="chat-md-p">{renderInlineMarkdown(line)}</p>);
    i++;
  }

  return elements;
};

const renderInlineMarkdown = (text) => {
  // Process inline code, bold, italic
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={idx} className="chat-inline-code">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={idx} className="font-semibold text-base-content">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    return <span key={idx}>{part}</span>;
  });
};

/* ─── Typing indicator (3 bouncing dots) ────────────────────────────────── */
const TypingIndicator = () => (
  <div className="chat-msg chat-msg-ai">
    <div className="chat-avatar chat-avatar-ai">
      <Sparkles className="w-4 h-4" />
    </div>
    <div className="chat-bubble-ai">
      <div className="typing-dots">
        <span className="typing-dot" style={{ animationDelay: "0ms" }} />
        <span className="typing-dot" style={{ animationDelay: "150ms" }} />
        <span className="typing-dot" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  </div>
);

/* ─── Streaming text component ──────────────────────────────────────────── */
const StreamingMessage = ({ fullText, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!fullText) return;

    let currentIndex = 0;
    const words = fullText.split(/(\s+)/); // Split but keep whitespace
    let accumulated = "";

    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        // Add 1-3 words at a time for natural feel
        const chunk = Math.min(Math.floor(Math.random() * 2) + 1, words.length - currentIndex);
        for (let j = 0; j < chunk; j++) {
          accumulated += words[currentIndex];
          currentIndex++;
        }
        setDisplayedText(accumulated);
      } else {
        clearInterval(streamInterval);
        setIsComplete(true);
        onComplete?.();
      }
    }, 25 + Math.random() * 20); // Variable speed: 25-45ms per chunk

    return () => clearInterval(streamInterval);
  }, [fullText]);

  return (
    <div className={`chat-md-content ${isComplete ? "" : "streaming"}`}>
      {renderMarkdown(displayedText)}
      {!isComplete && <span className="streaming-cursor" />}
    </div>
  );
};

/* ─── Message with copy button ──────────────────────────────────────────── */
const MessageBubble = ({ msg, isStreaming, onStreamComplete }) => {
  const [copied, setCopied] = useState(false);
  const isAI = msg.role === "assistant";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className={`chat-msg ${isAI ? "chat-msg-ai" : "chat-msg-user"}`}>
      {/* Avatar */}
      <div className={`chat-avatar ${isAI ? "chat-avatar-ai" : "chat-avatar-user"}`}>
        {isAI ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>

      {/* Bubble */}
      <div className={`chat-bubble-wrap ${isAI ? "chat-bubble-ai-wrap" : "chat-bubble-user-wrap"}`}>
        <div className={isAI ? "chat-bubble-ai" : "chat-bubble-user"}>
          {isAI && isStreaming ? (
            <StreamingMessage fullText={msg.content} onComplete={onStreamComplete} />
          ) : (
            <div className="chat-md-content">
              {isAI ? renderMarkdown(msg.content) : msg.content}
            </div>
          )}
        </div>

        {/* Copy button for AI messages */}
        {isAI && !isStreaming && (
          <button
            onClick={handleCopy}
            className="chat-copy-btn"
            title="Copy response"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Main ChatAi component ─────────────────────────────────────────────── */
function ChatAi({ problem }) {
  if (!problem) {
    return <div className="p-4 text-gray-500">Loading AI Chat...</div>;
  }

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! 👋 I'm your AI tutor for this problem. Ask me anything — hints, approach ideas, complexity analysis, or code review. I'm here to help you think through it!"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingIndex, setStreamingIndex] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (streamingIndex !== null) {
      const interval = setInterval(scrollToBottom, 100);
      return () => clearInterval(interval);
    }
  }, [streamingIndex, scrollToBottom]);

  const onSubmit = async (data) => {
    const trimmed = data.message.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    reset();
    setIsLoading(true);

    try {
      const response = await axiosClient.post("/ai/chat", {
        messages: updatedMessages,
        title: problem.title,
        description: problem.description,
        testCases: problem.visibleTestCases,
        startCode: problem.startCode
      });

      const aiMessage = {
        role: "assistant",
        content: response.data.message
      };

      setMessages(prev => [...prev, aiMessage]);
      setStreamingIndex(updatedMessages.length); // Index of the new AI message
      setIsLoading(false);
    } catch (err) {
      console.error("AI ERROR:", err);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Something went wrong. Please try again."
        }
      ]);
      setStreamingIndex(null);
      setIsLoading(false);
    }
  };

  const handleStreamComplete = () => {
    setStreamingIndex(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="chatai-container">
      {/* Messages */}
      <div className="chatai-messages thin-scroll">
        {messages.map((msg, index) => (
          <MessageBubble
            key={index}
            msg={msg}
            isStreaming={streamingIndex === index}
            onStreamComplete={handleStreamComplete}
          />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input — pinned at bottom */}
      <div className="chatai-input-area">
        <form onSubmit={handleSubmit(onSubmit)} className="chatai-form">
          <div className="chatai-input-wrap">
            <input
              ref={inputRef}
              placeholder="Ask about this problem..."
              className="chatai-input"
              disabled={isLoading}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              {...register("message", { required: true, minLength: 2 })}
            />
            <button
              type="submit"
              className="chatai-send-btn"
              disabled={isLoading || errors.message}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="chatai-disclaimer">AI may produce inaccurate responses. Verify important information.</p>
        </form>
      </div>
    </div>
  );
}

export default ChatAi;
