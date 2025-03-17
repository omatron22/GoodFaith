"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db";

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(!!data.user);
      setLoading(false);
    }
    checkAuth();
  }, []);

  const navigateBasedOnAuth = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-bold mb-4">
          <span className="text-green-500">Good</span>Faith
        </h1>
        
        <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-8">
          Explore your moral reasoning framework through interactive questions based on 
          Kohlberg&apos;s stages of moral development.
        </p>
        
        <button 
          onClick={navigateBasedOnAuth}
          disabled={loading}
          className="mt-6 px-8 py-4 bg-green-500 text-white rounded-lg text-lg font-medium hover:bg-green-600 hover:scale-105 transition transform shadow-md disabled:opacity-70"
        >
          {loading ? "Loading..." : isLoggedIn ? "Go to Dashboard" : "Start Your Journey"}
        </button>
        
        <p className="mt-4 text-gray-500">
          {isLoggedIn ? "Continue your moral exploration" : "Sign up to begin your ethical journey"}
        </p>
      </div>

      {/* Features Section */}
      <div className="mt-20 w-full max-w-4xl">
        <h2 className="text-3xl font-bold mb-8">Explore Your Moral Framework</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Discover Your Values</h3>
            <p className="text-gray-600">Gain insights into your moral reasoning through thoughtful questions and AI-guided analysis.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Resolve Contradictions</h3>
            <p className="text-gray-600">Identify and reconcile inconsistencies in your moral reasoning to develop a coherent ethical framework.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Learn & Grow</h3>
            <p className="text-gray-600">Access educational resources on moral philosophy and track your progress through Kohlberg&apos;s stages.</p>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="mt-20 bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-lg shadow-md w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Ready to explore your moral framework?</h2>
        <p className="text-gray-700 mb-6">
          Join GoodFaith today and embark on a journey of ethical self-discovery through interactive moral reasoning.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/login" 
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}