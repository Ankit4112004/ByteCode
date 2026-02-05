import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send } from "lucide-react";

function ChatAi({ problem }) {
  if (!problem) {
    return <div className="p-4 text-gray-500">Loading AI Chat...</div>;
  }

  // ✅ OpenAI / Groq compatible format
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! Ask me anything about this problem."
    }
  ]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSubmit = async (data) => {
    const trimmed = data.message.trim();
    if (!trimmed) return;

    const userMessage = {
      role: "user",
      content: trimmed
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    reset();

    try {
      const response = await axiosClient.post("/ai/chat", {
        messages: updatedMessages,
        title: problem.title,
        description: problem.description,
        testCases: problem.visibleTestCases,
        startCode: problem.startCode
      });

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: response.data.message
        }
      ]);
    } catch (err) {
      console.error("AI ERROR:", err);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Error from AI Chatbot"
        }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh] min-h-[500px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat ${
              msg.role === "user" ? "chat-end" : "chat-start"
            }`}
          >
            <div className="chat-bubble bg-base-200 text-base-content">
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-4 border-t bg-base-100"
      >
        <div className="flex items-center gap-2">
          <input
            placeholder="Ask me anything"
            className="input input-bordered flex-1"
            {...register("message", { required: true, minLength: 2 })}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={errors.message}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatAi;
