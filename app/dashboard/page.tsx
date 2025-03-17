// app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/db";
import { getProgress, Progress, getResponses, ResponseEntry } from "@/lib/db";
import { kohlbergStages } from "@/lib/constants";

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [responses, setResponses] = useState<ResponseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        const { data } = await supabase.auth.getUser();
        
        if (!data?.user) {
          router.push("/login");
          return;
        }
        
        setUserId(data.user.id);
        
        // Fetch user progress
        const userProgress = await getProgress(data.user.id);
        setProgress(userProgress);
        
        // Fetch user responses
        if (data.user.id) {
          const userResponses = await getResponses(data.user.id);
          setResponses(userResponses);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [router]);

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign out");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner h-12 w-12 border-4 border-t-green-500 border-r-transparent border-b-green-500 border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your moral journey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h2 className="text-red-800 font-medium">Error</h2>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentStage = progress?.stage_number || 1;
  const stageInfo = kohlbergStages.find(s => s.stageNumber === currentStage);
  const completedResponses = responses.filter(r => r.answer && r.answer.trim() !== "");
  const completedStages = progress?.completed_stages || [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          <span className="text-green-500">Good</span>Faith Dashboard
        </h1>
        
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Sign Out
        </button>
      </div>
      
      {/* Current Progress Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Moral Journey</h2>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium">Current Stage: {currentStage}</h3>
          <p className="text-gray-700">
            <span className="font-medium">{stageInfo?.name}</span> - {stageInfo?.shortDescription}
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div 
            className="bg-green-500 h-4 rounded-full" 
            style={{ width: `${Math.min((completedResponses.length / 12) * 100, 100)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600 mb-6">
          <span>0 Questions</span>
          <span>12 Questions</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {kohlbergStages.map((stage) => (
            <div 
              key={stage.stageNumber}
              className={`px-3 py-1 rounded-full text-sm ${
                completedStages.includes(stage.stageNumber)
                  ? "bg-green-100 text-green-800"
                  : stage.stageNumber === currentStage
                  ? "bg-blue-100 text-blue-800 border-2 border-blue-300"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              Stage {stage.stageNumber}
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-center">
          <Link 
            href="/chat" 
            className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg hover:bg-green-600 hover:scale-105 transition transform"
          >
            {completedResponses.length > 0 ? "Continue Journey" : "Start Journey"}
          </Link>
        </div>
      </div>
      
      {/* Recent Responses Section */}
      {completedResponses.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Recent Responses</h2>
          
          <div className="space-y-4">
            {completedResponses.slice(-3).reverse().map((response) => (
              <div key={response.id} className="border-l-4 border-green-400 pl-4 py-2">
                <p className="font-medium text-gray-800">{response.question_text}</p>
                <p className="text-gray-600 mt-1">{response.answer}</p>
                <div className="mt-2 flex items-center">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    Stage {response.stage_number}
                  </span>
                  {response.contradiction_flag && (
                    <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      Contradiction Detected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/history" className="text-green-600 hover:text-green-700">
              View All Responses →
            </Link>
          </div>
        </div>
      )}
      
      {/* Information About Kohlberg's Stages */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">About Kohlberg's Moral Development Stages</h2>
        
        <p className="text-gray-700 mb-4">
          Lawrence Kohlberg's theory proposes that moral reasoning develops through six stages,
          grouped into three levels. As you progress through the questions, we'll help you
          understand your moral reasoning framework.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {kohlbergStages.map((stage) => (
            <div key={stage.stageNumber} className="border rounded-lg p-4">
              <h3 className="font-medium">
                Stage {stage.stageNumber}: {stage.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{stage.level} Level</p>
              <p className="text-gray-700 mt-2">{stage.shortDescription}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}