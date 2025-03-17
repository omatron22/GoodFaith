// app/results/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/db";

export default function ResultsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.push("/login");
      } else {
        // Set a generic username based on email
        const email = data.user.email;
        if (email) {
          const name = email.split('@')[0];
          setUserName(name.charAt(0).toUpperCase() + name.slice(1));
        }
      }
    }
    
    checkAuth();
    
    // Get summary from URL params if available
    const summaryParam = searchParams.get("summary");
    if (summaryParam) {
      setSummary(decodeURIComponent(summaryParam));
    } else {
      // Otherwise, fetch it from the API
      fetchSummary();
    }
  }, [router, searchParams]);
  
  async function fetchSummary() {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        throw new Error("User not authenticated");
      }
      
      const userId = data.user.id;
      
      const res = await fetch("/api/progress/final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      
      const resData = await res.json();
      if (resData.error) throw new Error(resData.error);
      
      setSummary(resData.summary || "No summary available.");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load summary";
      setError(errorMessage);
      console.error("Summary fetch error:", err);
    } finally {
      setLoading(false);
    }
  }
  
  // Function to share results (could be expanded)
  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: 'My GoodFaith Moral Framework',
        text: 'Check out my moral framework analysis from GoodFaith!',
        url: window.location.href,
      })
      .catch((error) => console.error('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => alert('Failed to copy link'));
    }
  }

  // Convert the summary text into sections if it follows the prescribed format
  const renderFormattedSummary = () => {
    if (!summary) return null;
    
    // Try to detect sections based on headers/numbers
    const sections = summary.split(/\n\d+\.\s|\n\n/g).filter(Boolean);
    
    if (sections.length >= 3) {
      return (
        <div className="space-y-6">
          {sections.map((section, index) => {
            // Try to extract a heading if it exists
            const lines = section.trim().split('\n');
            const heading = lines[0].includes(':') 
              ? lines[0].split(':')[0] 
              : `Section ${index + 1}`;
            
            const content = lines[0].includes(':') 
              ? [lines[0].split(':')[1], ...lines.slice(1)].join('\n') 
              : section;
            
            return (
              <div key={index} className="bg-white p-5 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-800 mb-2">{heading}</h3>
                <div className="text-gray-700 whitespace-pre-line">{content}</div>
              </div>
            );
          })}
        </div>
      );
    }
    
    // Fallback to simple format if pattern doesn't match
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Your Moral Framework Analysis</h3>
        <div className="text-gray-700 whitespace-pre-line">{summary}</div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner h-12 w-12 border-4 border-t-green-500 border-r-transparent border-b-green-500 border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing your moral framework...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">
          <span className="text-green-500">Your Moral Framework</span> Analysis
        </h1>
        <p className="mt-2 text-gray-600">
          Based on your responses throughout your GoodFaith journey
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="mb-8">
        <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
              {userName ? userName.charAt(0) : "U"}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-medium">{userName || "User"}&apos;s Framework</h2>
              <p className="text-gray-500 text-sm">Completed on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          {renderFormattedSummary()}
          
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleShare}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              Share Results
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">What&apos;s Next?</h2>
        <p className="text-gray-700 mb-4">
          Your moral journey doesn&apos;t end here. Continue to explore and refine your ethical framework with these suggestions:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <h3 className="font-medium text-green-600">Continue Your Journey</h3>
            <p className="text-gray-600 mt-1">Explore more moral questions and scenarios to further refine your understanding.</p>
            <Link href="/chat" className="text-green-500 hover:text-green-700 text-sm mt-2 inline-block">
              Start New Session →
            </Link>
          </div>
          
          <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <h3 className="font-medium text-blue-600">Review Your Answers</h3>
            <p className="text-gray-600 mt-1">Look back at your responses to see patterns and growth in your moral reasoning.</p>
            <Link href="/history" className="text-blue-500 hover:text-blue-700 text-sm mt-2 inline-block">
              View History →
            </Link>
          </div>
          
          <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <h3 className="font-medium text-purple-600">Learn More</h3>
            <p className="text-gray-600 mt-1">Deepen your understanding of moral philosophy and ethical frameworks.</p>
            <Link href="/resources" className="text-purple-500 hover:text-purple-700 text-sm mt-2 inline-block">
              Explore Resources →
            </Link>
          </div>
          
          <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <h3 className="font-medium text-orange-600">Share Your Experience</h3>
            <p className="text-gray-600 mt-1">Tell others about your GoodFaith journey and what you&apos;ve learned.</p>
            <button 
              onClick={handleShare}
              className="text-orange-500 hover:text-orange-700 text-sm mt-2"
            >
              Share Results →
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
          ← Back to Dashboard
        </Link>
        
        <Link href="/chat" className="text-green-600 hover:text-green-800">
          Start New Journey →
        </Link>
      </div>
    </div>
  );
}