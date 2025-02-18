import { useState } from "react";

export default function ChatBox({ userId, onContradictionResolved }: { userId: string; onContradictionResolved: () => void }) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [unresolvedContradiction, setUnresolvedContradiction] = useState<string | null>(null);

  async function sendMessage() {
    if (!message.trim()) return;
  
    setChatHistory((prev) => [...prev, `You: ${message}`]);
  
    // ✅ Use correct API route
    const contradictionRes = await fetch("/api/resolve-contradictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  
    const { contradictionCheck } = await contradictionRes.json();
  
    if (contradictionCheck !== "No contradiction detected.") {
      setUnresolvedContradiction(contradictionCheck);
      setChatHistory((prev) => [...prev, `System: ${contradictionCheck}`]);
    } else {
      setUnresolvedContradiction(null);
      setChatHistory((prev) => [...prev, `System: No contradiction detected. Proceeding...`]);
  
      // Let the parent component know that the contradiction is resolved
      onContradictionResolved();
    }
  
    setMessage("");
  }
  

  return (
    <div className="p-4 border rounded-lg shadow-lg w-full max-w-lg">
      <div className="h-60 overflow-y-auto border-b mb-4 p-2">
        {chatHistory.map((msg, idx) => (
          <p key={idx} className={msg.startsWith("You") ? "text-blue-600" : "text-red-600"}>
            {msg}
          </p>
        ))}
      </div>

      {unresolvedContradiction && (
        <div className="p-2 bg-red-100 border border-red-500 rounded mt-2">
          <p className="text-red-700 font-semibold">⚠️ Contradiction Detected:</p>
          <p>{unresolvedContradiction}</p>
          <p className="text-sm text-gray-600">Clarify your stance before proceeding.</p>
        </div>
      )}

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-2 border mt-2"
        placeholder="Type your response..."
      />
      <button 
        onClick={sendMessage} 
        className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
        disabled={!!unresolvedContradiction} // Disable button if contradiction exists
      >
        Send
      </button>
    </div>
  );
}
