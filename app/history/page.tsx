"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/db/supabase-client";
import { getResponses, ResponseEntry } from "@/lib/db";
import { kohlbergStages } from "@/lib/constants";
import { formatDate, timeAgo } from "@/lib/utils";
import { AuthError } from "@supabase/supabase-js";

interface APIError {
  message: string;
  status?: number;
}

export default function HistoryPage() {
  const [responses, setResponses] = useState<ResponseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<number | null>(null);
  const [includeSuperseded, setIncludeSuperseded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchResponses() {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        const allResponses = await getResponses(user.id, includeSuperseded);
        setResponses(allResponses);
      } catch (error: unknown) {
        let errorMessage = "Failed to load response history";
        
        if (error instanceof AuthError) {
          errorMessage = error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage = (error as APIError).message;
        }
        
        setError(errorMessage);
        console.error("History load error:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchResponses();
  }, [router, includeSuperseded]);

  // Filter responses by stage if filter is set
  const filteredResponses = filter === null
    ? responses
    : responses.filter(response => response.stage_number === filter);
  
  // Group responses by date
  const groupedByDate = filteredResponses.reduce((groups: Record<string, ResponseEntry[]>, response) => {
    const dateStr = response.created_at ? new Date(response.created_at).toDateString() : 'Unknown Date';
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(response);
    return groups;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    if (a === 'Unknown Date') return 1;
    if (b === 'Unknown Date') return -1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner h-10 w-10 border-4 border-t-green-500 border-r-transparent border-b-green-500 border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          <span className="text-green-500">Response</span> History
        </h1>
        
        <div className="flex space-x-2">
          <Link 
            href="/dashboard" 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0">
          <div>
            <label htmlFor="stage-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Stage
            </label>
            <select
              id="stage-filter"
              value={filter === null ? "all" : filter}
              onChange={(e) => setFilter(e.target.value === "all" ? null : Number(e.target.value))}
              className="w-full sm:w-auto p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Stages</option>
              {kohlbergStages.map(stage => (
                <option key={stage.stageNumber} value={stage.stageNumber}>
                  Stage {stage.stageNumber}: {stage.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeSuperseded}
                onChange={(e) => setIncludeSuperseded(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Include superseded responses</span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Response List */}
      {filteredResponses.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No responses yet</h3>
          <p className="mt-1 text-gray-500">Start your moral journey to see your responses here.</p>
          <div className="mt-6">
            <Link href="/chat" className="text-green-600 hover:text-green-500">
              Start answering questions →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(dateStr => (
            <div key={dateStr} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <h2 className="p-4 border-b border-gray-200 font-medium text-gray-700">
                {dateStr === 'Unknown Date' ? 'Unknown Date' : formatDate(new Date(dateStr))}
              </h2>
              
              <div className="divide-y divide-gray-100">
                {groupedByDate[dateStr].sort((a, b) => {
                  if (!a.created_at || !b.created_at) return 0;
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }).map((response) => (
                  <div 
                    key={response.id} 
                    className={`p-4 ${response.superseded ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        {response.stage_number && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                            Stage {response.stage_number}
                          </span>
                        )}
                        {response.superseded && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Superseded
                          </span>
                        )}
                        {response.contradiction_flag && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                            Contradiction
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {response.created_at ? timeAgo(response.created_at) : 'Unknown time'}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <h3 className="text-md font-medium text-gray-900">Question:</h3>
                      <p className="text-gray-700 mt-1">{response.question_text}</p>
                    </div>
                    
                    {response.answer && (
                      <div>
                        <h3 className="text-md font-medium text-gray-900">Your Answer:</h3>
                        <p className="text-gray-700 mt-1">{response.answer}</p>
                      </div>
                    )}
                    
                    {response.version > 1 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Version: {response.version}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8 flex justify-between">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
          ← Back to Dashboard
        </Link>
        
        <Link href="/chat" className="text-green-600 hover:text-green-800">
          Continue Journey →
        </Link>
      </div>
    </div>
  );
}