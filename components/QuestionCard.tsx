"use client";

import React from "react";

interface QuestionCardProps {
  question: string;
  loading: boolean;
  error?: string;
}

/**
 * Renders the current question with a clean UI.
 * Handles loading and error states.
 */
const QuestionCard: React.FC<QuestionCardProps> = ({ question, loading, error }) => {
  return (
    <div className="p-4 bg-white shadow-md rounded-lg border border-gray-300">
      <h2 className="text-lg font-semibold text-gray-800">Current Question</h2>

      {loading ? (
        <p className="text-gray-500 italic">Loading question...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <p className="mt-2 text-gray-700">{question || "No question available yet."}</p>
      )}
    </div>
  );
};

export default QuestionCard;
