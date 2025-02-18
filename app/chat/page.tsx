"use client";
import { useEffect, useState } from "react";
import QuestionCard from "@/components/QuestionCard";

export default function ChatPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [question, setQuestion] = useState<{ id: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRoot, setCurrentRoot] = useState<string | null>(null);
  const [responsesCount, setResponsesCount] = useState<number>(0);
  const [contradictionsExist, setContradictionsExist] = useState<boolean>(false);

  /** ✅ Start a new session */
  async function startSession() {
    try {
      setLoading(true);
      const res = await fetch("/api/start-session", { method: "POST" });
      if (!res.ok) throw new Error("Failed to start session");

      const data = await res.json();
      setUserId(data.userId);
      localStorage.setItem("userId", data.userId);
      await fetchNextQuestion(data.userId);
    } catch (err: any) {
      console.error("Error starting session:", err.message);
      setError("Could not start session. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  /** ✅ Fetch the next question */
  async function fetchNextQuestion(existingUserId?: string) {
    try {
      setLoading(true);
      setError(null);

      const storedUserId = existingUserId || localStorage.getItem("userId");
      if (!storedUserId) {
        await startSession();
        return;
      }

      setUserId(storedUserId);
      const res = await fetch(`/api/questions?userId=${storedUserId}`);
      if (!res.ok) throw new Error("Failed to fetch question");

      const data = await res.json();
      if (data.message) {
        // e.g. "All roots explored" or some other info
        setError(data.message);
        return;
      }

      if (data.resolutionQuestion) {
        setError("A contradiction must be resolved before proceeding.");
        setQuestion({ id: crypto.randomUUID(), text: data.resolutionQuestion });
        setContradictionsExist(true);
        return;
      }

      if (!data.question) throw new Error("No question received");

      setQuestion({ id: crypto.randomUUID(), text: data.question });
      setCurrentRoot(data.topic);
      setResponsesCount(data.responsesCount || 0);
      setContradictionsExist(false);
    } catch (err: any) {
      console.error("Error fetching question:", err.message);
      setError("Could not load a question. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /** ✅ Reset the current session data entirely */
  async function resetSession() {
    if (!userId) {
      // If there's no userId, just start a new one
      startSession();
      return;
    }
    try {
      setLoading(true);
      // Call our new endpoint to delete progress/responses
      const res = await fetch("/api/reset-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error("Failed to reset session");

      // Clear localStorage
      localStorage.removeItem("userId");

      // Now start a new session
      await startSession();
    } catch (err: any) {
      console.error("Error resetting session:", err.message);
      setError("Could not reset session. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  // Load or create session on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      fetchNextQuestion(storedUserId);
    } else {
      startSession();
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">GoodFaith Questions</h1>

      <button
        onClick={resetSession}
        className="bg-red-500 text-white px-4 py-2 mb-2 rounded"
      >
        Reset Session
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <div className="mb-4 text-center">
            <h2 className="text-xl font-semibold">{currentRoot}</h2>
            <p>Responses given: {responsesCount}</p>
            {contradictionsExist && (
              <p className="text-red-500">Contradiction detected! Resolve before proceeding.</p>
            )}
          </div>
          {question && userId && (
            <QuestionCard 
              key={question.id}
              userId={userId}
              questionId={question.id}
              questionText={question.text}
              fetchNextQuestion={fetchNextQuestion}
            />
          )}
        </>
      )}
    </div>
  );
}
