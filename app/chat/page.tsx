"use client";

import React, { useState, useEffect } from "react";
import QuestionCard from "@/components/QuestionCard";
import ChatBox from "@/components/ChatBox";

/**
 * This is the main chat interface that communicates with the back-end API.
 * It manages:
 * - Fetching and storing user progress
 * - Asking and answering questions
 * - Handling contradictions and resolutions
 */
export default function ChatPage() {
  const userId = "test-user-123"; // TODO: Replace with real user ID logic

  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>("");
  const [history, setHistory] = useState<Array<{ question: string; answer: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [contradiction, setContradiction] = useState<string | null>(null);
  const [resolving, setResolving] = useState<boolean>(false);
  const [resolutionText, setResolutionText] = useState<string>("");

  useEffect(() => {
    initUserProgress().then(fetchNextQuestion).catch(console.error);
  }, []);

  /** Step 1: Fetch or initialize user progress */
  async function initUserProgress() {
    try {
      const res = await fetch(`/api/progress?userId=${userId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
    } catch (err: any) {
      setError(err.message);
    }
  }

  /** Step 2: Fetch the next question */
  async function fetchNextQuestion() {
    try {
      setLoading(true);
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setCurrentQuestion(data.question);
      setCurrentResponseId(data.responseId);
      setAnswer("");
      setContradiction(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /** Step 3: Submit user answer & check for contradictions */
  async function handleAnswerSubmit() {
    if (!currentResponseId || !answer.trim()) {
      setError("Invalid response or missing answer.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/responses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseId: currentResponseId, userId, answer }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.contradiction) {
        setContradiction(data.details);
        setResolving(true);
      } else {
        setHistory((prev) => [...prev, { question: currentQuestion, answer }]);
        fetchNextQuestion();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /** Step 4: Handle contradiction resolution */
  async function handleContradictionResolution() {
    if (!resolutionText.trim()) return;
    try {
      setLoading(true);
      const res = await fetch("/api/contradictions/check-resolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, resolutionText }),
      });
      const data = await res.json();
      if (data.resolved) {
        setContradiction(null);
        setResolving(false);
        fetchNextQuestion();
      } else {
        setError("Resolution not sufficient. Try refining your answer.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /** (Optional) Load full conversation history */
  async function loadConversationHistory() {
    try {
      const res = await fetch(`/api/responses?userId=${userId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setHistory(
        data.responses.map((r: any) => ({ question: r.question_text, answer: r.answer || "" }))
      );
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Good Faith Moral Chat</h1>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <button
        onClick={loadConversationHistory}
        className="mb-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Load Conversation History
      </button>

      <hr className="my-4" />

      {/* Contradiction Resolution UI */}
      {resolving ? (
        <div className="p-4 bg-red-100 border border-red-400 rounded-lg">
          <h2 className="text-lg font-semibold text-red-700">Contradiction Detected</h2>
          <p className="text-gray-800">{contradiction}</p>
          <textarea
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
            placeholder="Explain or refine your response..."
            rows={3}
            className="w-full p-2 border rounded mt-2"
          />
          <button
            onClick={handleContradictionResolution}
            disabled={loading}
            className="mt-2 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Submit Resolution
          </button>
        </div>
      ) : (
        <div>
          {/* Integrated QuestionCard */}
          <QuestionCard question={currentQuestion} loading={loading} error={error || ""} />

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your answer..."
            rows={3}
            className="w-full p-2 border rounded mt-4"
          />

          <button
            onClick={handleAnswerSubmit}
            disabled={loading}
            className="mt-2 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Submit Answer
          </button>
        </div>
      )}

      <hr className="my-4" />

      {/* Integrated ChatBox */}
      <ChatBox history={history} />
    </div>
  );
}
