import { useState } from "react";

export default function QuestionCard({ userId, questionId, questionText, fetchNextQuestion }: { 
  userId: string;
  questionId: string; 
  questionText: string; 
  fetchNextQuestion: () => Promise<void>; 
}) {
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    try {
      if (!response.trim()) {
        alert("Response cannot be empty!");
        return;
      }

      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId, // ✅ Auto-pass the stored userId
          questionId,
          answer: response.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to save response");

      if (data.contradictionDetails) {
        setError(`Contradiction found: ${data.contradictionDetails}`);
        return;
      }
      

      // Reset response and fetch the next question
      setResponse("");
      setError(null);
      await fetchNextQuestion();  
    } catch (error) {
      console.error("Error submitting response:", error);
      setError("Failed to submit response. Please try again.");
    }
  }

  return (
    <div className="p-4 border rounded-lg shadow mb-4">
      <h2 className="text-lg font-bold">{questionText}</h2>
      {error && <p className="text-red-500">{error}</p>}
      <textarea 
        value={response} 
        onChange={(e) => setResponse(e.target.value)} 
        className="w-full p-2 border mt-2"
      />
      <button 
        onClick={handleSubmit} 
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Submit
      </button>
    </div>
  );
}
