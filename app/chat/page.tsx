// app/chat/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db";
import QuestionCard from "@/components/QuestionCard";
import ChatBox from "@/components/ChatBox";
import { kohlbergStages } from "@/lib/constants";

export default function ChatPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>("");
  const [history, setHistory] = useState<Array<{ question: string; answer: string; id?: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [contradiction, setContradiction] = useState<string | null>(null);
  const [resolving, setResolving] = useState<boolean>(false);
  const [resolutionText, setResolutionText] = useState<string>("");
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [thinking, setThinking] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>("");
  const [showCustomQuestion, setShowCustomQuestion] = useState<boolean>(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Fetch the authenticated user's ID from Supabase
  useEffect(() => {
    async function fetchUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (data?.user) {
          setUserId(data.user.id);
        } else {
          router.push("/login");
        }
      } catch (err: any) {
        setError(err.message || "Authentication error");
        console.error("Auth error:", err);
      }
    }
    fetchUser();
  }, [router]);

  const initUserProgress = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/progress");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // Set current stage from progress data
      if (data.progress && data.progress.stage_number) {
        setCurrentStage(data.progress.stage_number);
      }
    } catch (err: any) {
      setError(err.message || "Failed to initialize progress");
      console.error("Progress init error:", err);
    }
  }, [userId]);

  const fetchNextQuestion = useCallback(async () => {
    if (!userId) return;
    try {
      setThinking(true);
      setLoading(true);
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setCurrentQuestion(data.question || "");
      setCurrentResponseId(data.responseId || null);
      setAnswer("");
      setContradiction(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch next question");
      console.error("Question fetch error:", err);
    } finally {
      setLoading(false);
      setThinking(false);
    }
  }, [userId]);

  const fetchCustomQuestion = async () => {
    if (!userId || !theme.trim()) return;
    try {
      setThinking(true);
      setLoading(true);
      const res = await fetch("/api/questions/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, theme }),
      });
      
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setCurrentQuestion(data.question || "");
      setCurrentResponseId(data.responseId || null);
      setAnswer("");
      setContradiction(null);
      setShowCustomQuestion(false);
      setTheme("");
    } catch (err: any) {
      setError(err.message || "Failed to generate custom question");
      console.error("Custom question error:", err);
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  useEffect(() => {
    if (userId) {
      initUserProgress().then(fetchNextQuestion).catch(console.error);
    }
  }, [userId, initUserProgress, fetchNextQuestion]);

  const loadConversationHistory = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/responses?userId=${userId}`);
      
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setHistory(
        data.responses?.map((r: any) => ({ 
          id: r.id,
          question: r.question_text, 
          answer: r.answer || "" 
        })) || []
      );
    } catch (err: any) {
      setError(err.message || "Failed to load conversation history");
      console.error("History load error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadConversationHistory();
    }
  }, [userId, loadConversationHistory]);

  async function handleAnswerSubmit() {
    if (!userId || !currentResponseId || !answer.trim()) {
      setError("Please provide an answer before submitting.");
      return;
    }
    try {
      setSubmitting(true);
      setLoading(true);
      const res = await fetch("/api/responses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseId: currentResponseId, userId, answer }),
      });
      
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.contradiction) {
        setContradiction(data.details || "A contradiction has been detected in your answers.");
        setResolving(true);
      } else {
        setHistory((prev) => [...prev, { id: currentResponseId || undefined, question: currentQuestion, answer }]);
        fetchNextQuestion();
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit answer");
      console.error("Answer submit error:", err);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  }

  async function handleContradictionResolution() {
    if (!userId || !resolutionText.trim()) {
      setError("Please provide an explanation to resolve the contradiction.");
      return;
    }
    try {
      setSubmitting(true);
      setLoading(true);
      const res = await fetch("/api/contradictions/check-resolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, resolutionText }),
      });
      
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.resolved) {
        setContradiction(null);
        setResolving(false);
        setResolutionText("");
        fetchNextQuestion();
      } else {
        setError("The contradiction hasn't been fully resolved. Please try to clarify your perspective further.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to check resolution");
      console.error("Resolution check error:", err);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  }

  async function handleGetFinalEvaluation() {
    if (!userId) return;
    try {
      setThinking(true);
      setLoading(true);
      const res = await fetch("/api/progress/final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Navigate to results page with the summary
      router.push(`/results?summary=${encodeURIComponent(data.summary)}`);
    } catch (err: any) {
      setError(err.message || "Failed to generate final evaluation");
      console.error("Final evaluation error:", err);
    } finally {
      setLoading(false);
      setThinking(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (resolving) {
        handleContradictionResolution();
      } else {
        handleAnswerSubmit();
      }
    }
  }

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [answer, resolutionText]);

  const currentStageInfo = kohlbergStages.find(s => s.stageNumber === currentStage);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-green-500">Good</span>Faith Moral Journey
        </h1>
        
        <div className="flex space-x-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Stage Indicator */}
      <div className="bg-blue-50 p-3 rounded-lg mb-4 flex items-center">
        <div className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-medium">
          Stage {currentStage}: {currentStageInfo?.name}
        </div>
        <div className="ml-3 text-sm text-blue-700">
          {currentStageInfo?.shortDescription}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center my-4">
          <div className="spinner h-6 w-6 border-2 border-t-green-500 border-r-transparent border-b-green-500 border-l-transparent rounded-full animate-spin mr-2"></div>
          <p className="text-gray-500">
            {thinking ? "Thinking..." : submitting ? "Submitting..." : "Loading..."}
          </p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex justify-between items-center">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            &times;
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        {/* Main Chat Section */}
        <div className="md:w-2/3 space-y-4">
          {resolving ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h2 className="text-lg font-semibold text-red-700 mb-2">Contradiction Detected</h2>
              <p className="text-gray-800 mb-4">{contradiction}</p>
              <div className="p-3 bg-white rounded-lg border border-gray-300">
                <textarea
                  ref={textareaRef}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Explain or refine your response to resolve this contradiction..."
                  rows={4}
                  className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-xs text-gray-500">Press Ctrl+Enter to submit</p>
                  <button
                    onClick={handleContradictionResolution}
                    disabled={loading || !resolutionText.trim()}
                    className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Submit Resolution
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <QuestionCard question={currentQuestion} loading={loading} error="" />
              
              {showCustomQuestion ? (
                <div className="p-3 bg-white rounded-lg border border-gray-300">
                  <input 
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="Enter a moral theme or topic..."
                    className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <div className="flex justify-between">
                    <button
                      onClick={() => setShowCustomQuestion(false)}
                      className="bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={fetchCustomQuestion}
                      disabled={loading || !theme.trim()}
                      className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                      Generate Question
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-lg border border-gray-300">
                  <textarea
                    ref={textareaRef}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Your answer..."
                    rows={4}
                    className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowCustomQuestion(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Request custom question
                      </button>
                    </div>
                    <div className="flex items-center">
                      <p className="text-xs text-gray-500 mr-2">Press Ctrl+Enter to submit</p>
                      <button 
                        onClick={handleAnswerSubmit} 
                        disabled={loading || !answer.trim()}
                        className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {history.length >= 5 && (
                <div className="flex justify-center mt-2">
                  <button
                    onClick={handleGetFinalEvaluation}
                    className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition-colors"
                  >
                    Get Final Evaluation
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* History Section */}
        <div className="md:w-1/3">
          <ChatBox history={history} />
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back to Dashboard
        </button>
        
        <button
          onClick={handleGetFinalEvaluation}
          className="text-green-600 hover:text-green-800"
        >
          Complete Journey →
        </button>
      </div>
    </div>
  );
}