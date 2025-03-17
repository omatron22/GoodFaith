// components/chat/question-card.tsx
"use client";

import React from "react";

interface QuestionCardProps {
  question: string;
  loading: boolean;
  error?: string;
}

/**
 * Renders the current question with a modern, visually appealing UI.
 * Handles loading and error states.
 */
const QuestionCard: React.FC<QuestionCardProps> = ({ question, loading, error }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 p-3 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Current Question</h2>
        {question && (
          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Moral Dilemma
          </div>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="spinner h-6 w-6 border-2 border-t-green-500 border-r-transparent border-b-green-500 border-l-transparent rounded-full animate-spin mr-2"></div>
            <p className="text-gray-500 italic">Thinking of a thought-provoking question...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg">
            <p className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </div>
        ) : question ? (
          <div className="py-2">
            <div className="quote-bg relative">
              <div className="text-3xl text-green-300 absolute -top-4 -left-2 opacity-50">&ldquo;</div>
              <p className="text-lg text-gray-800 relative z-10 pl-4">{question}</p>
              <div className="text-3xl text-green-300 absolute -bottom-8 -right-2 opacity-50">&rdquo;</div>
            </div>
            <div className="mt-4 text-sm text-gray-500 italic">
              Take your time to reflect on this question before answering
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">No question available yet.</p>
            <p className="text-gray-400 text-sm">Your moral journey will begin soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;