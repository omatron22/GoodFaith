"use client";

import React, { useEffect, useRef } from "react";

interface ChatBoxProps {
  history: Array<{ question: string; answer: string }>;
}

/**
 * Renders the conversation history in a chat-like UI.
 * Auto-scrolls to the latest message for a smooth experience.
 */
const ChatBox: React.FC<ChatBoxProps> = ({ history }) => {
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-md max-h-96 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Conversation History</h2>

      {history.length === 0 ? (
        <p className="text-gray-500 italic">No conversation history yet.</p>
      ) : (
        <div className="space-y-4">
          {history.map((item, index) => (
            <div key={index} className="flex flex-col space-y-1">
              <p className="text-blue-700 font-medium">Q: {item.question}</p>
              <p className="text-gray-800">A: {item.answer || "No answer yet."}</p>
              <hr className="border-gray-300 mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Invisible div to ensure smooth scrolling to the last message */}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatBox;
