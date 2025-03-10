"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/db";
import QuestionCard from "@/components/QuestionCard";
import ChatBox from "@/components/ChatBox";

export default function ChatPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>("");
  const [history, setHistory] = useState<Array<{ question: string; answer: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [contradiction, setContradiction] = useState<string | null>(null);
  const [resolving, setResolving] = useState<boolean>(false);
  const [resolutionText, setResolutionText] = useState<string>("");

  // ✅ Fetch the authenticated user's ID from Supabase
  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      } else {
        setError("User not authenticated");
      }
    }
    fetchUser();
  }, []);

  const initUserProgress = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/progress?userId=${userId}`);
      const data: { error?: string } = await res.json();
      if (data.error) throw new Error(data.error);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [userId]);

  const fetchNextQuestion = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data: { question?: string; responseId?: string; error?: string } = await res.json();
      if (data.error) throw new Error(data.error);

      setCurrentQuestion(data.question || "");
      setCurrentResponseId(data.responseId || null);
      setAnswer("");
      setContradiction(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      initUserProgress().then(fetchNextQuestion).catch(console.error);
    }
  }, [userId, initUserProgress, fetchNextQuestion]);

  async function handleAnswerSubmit() {
    if (!userId || !currentResponseId || !answer.trim()) {
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
      const data: { contradiction?: boolean; details?: string; error?: string } = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.contradiction) {
        setContradiction(data.details || "Contradiction detected.");
        setResolving(true);
      } else {
        setHistory((prev) => [...prev, { question: currentQuestion, answer }]);
        fetchNextQuestion();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleContradictionResolution() {
    if (!userId || !resolutionText.trim()) return;
    try {
      setLoading(true);
      const res = await fetch("/api/contradictions/check-resolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, resolutionText }),
      });
      const data: { resolved?: boolean; error?: string } = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.resolved) {
        setContradiction(null);
        setResolving(false);
        fetchNextQuestion();
      } else {
        setError("Resolution not sufficient. Try refining your answer.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadConversationHistory() {
    if (!userId) return;
    try {
      const res = await fetch(`/api/responses?userId=${userId}`);
      const data: { responses?: Array<{ question_text: string; answer: string }>; error?: string } = await res.json();
      if (data.error) throw new Error(data.error);

      setHistory(
        data.responses?.map((r) => ({ question: r.question_text, answer: r.answer || "" })) || []
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!userId) return <p>Loading user...</p>;

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
          <QuestionCard question={currentQuestion} loading={loading} error={error || ""} />
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your answer..."
            rows={3}
            className="w-full p-2 border rounded mt-4"
          />
          <button onClick={handleAnswerSubmit} className="mt-2 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
            Submit Answer
          </button>
        </div>
      )}

      <hr className="my-4" />
      <ChatBox history={history} />
    </div>
  );
}
