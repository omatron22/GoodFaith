// components/ChatBox.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

interface ChatBoxProps {
  history: Array<{ question: string; answer: string; id?: string }>;
}

/**
 * Renders the conversation history in a chat-like UI.
 * Auto-scrolls to the latest message for a smooth experience.
 */
const ChatBox: React.FC<ChatBoxProps> = ({ history }) => {
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Toggle item expansion
  const toggleItem = (id: string | undefined) => {
    if (!id) return;
    setExpandedItem(expandedItem === id ? null : id);
  };

  // Format timestamp for display
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Truncate long text for better UI
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 p-3 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Conversation History</h2>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-300px)] p-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No conversation yet</p>
            <p className="text-gray-400 text-xs mt-1">Your moral journey will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((item, index) => (
              <div 
                key={item.id || index} 
                className="rounded-lg overflow-hidden transition-all duration-200 ease-in-out"
              >
                {/* Question Bubble */}
                <div className="flex items-start mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <span className="text-green-600 text-sm font-medium">Q</span>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 max-w-[85%]">
                    <p className="text-gray-800">{item.question}</p>
                    <span className="text-xs text-gray-500 mt-1 block">{formatTime()}</span>
                  </div>
                </div>

                {/* Answer Bubble */}
                {item.answer && (
                  <div className="flex items-start flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                      <span className="text-blue-600 text-sm font-medium">A</span>
                    </div>
                    <div 
                      className="bg-blue-50 rounded-lg p-3 max-w-[85%] cursor-pointer"
                      onClick={() => toggleItem(item.id)}
                    >
                      <p className="text-gray-800">
                        {expandedItem === item.id ? item.answer : truncateText(item.answer)}
                        {item.answer.length > 100 && (
                          <button 
                            className="text-blue-500 hover:text-blue-700 text-xs ml-1 font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItem(item.id);
                            }}
                          >
                            {expandedItem === item.id ? "Show less" : "Show more"}
                          </button>
                        )}
                      </p>
                      <span className="text-xs text-gray-500 mt-1 block">{formatTime()}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

export default ChatBox;