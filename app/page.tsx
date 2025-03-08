"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center text-center px-4">
      {/* Title */}
      <h1 className="text-6xl font-bold mb-4">
        <span className="text-green-500">Good</span>Faith
      </h1>

      {/* Tagline */}
      <p className="text-lg text-gray-700 max-w-md animate-pulse">
        Challenge your moral reasoning. Discover your framework.
      </p>

      {/* Start Button */}
      <Link href="/chat">
        <button className="mt-6 px-6 py-3 bg-green-500 text-white rounded-lg text-lg hover:bg-green-600 hover:scale-105 transition transform">
          Start Exploring
        </button>
      </Link>
    </div>
  );
}
