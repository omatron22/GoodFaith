// components/layout/auth-header.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/db/supabase-client";

export default function AuthHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  
  const pathname = usePathname();
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getUser();
        setIsLoggedIn(!!data.user);
        setUserEmail(data.user?.email || null);
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
    
    // Setup auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session);
        setUserEmail(session?.user?.email || null);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (dropdownOpen && target.closest('[data-dropdown]') === null) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }
  
  // Determine if a navigation item is active
  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  // Format email for display
  const formatEmail = (email: string | null) => {
    if (!email) return "User";
    if (email.length > 15) {
      return email.substring(0, 12) + "...";
    }
    return email;
  };

  return (
    <header className="w-full py-4 bg-white shadow-md fixed top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl font-semibold hover:text-green-500 transition">
          <span className="text-green-500">Good</span>Faith
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          <Link 
            href="/" 
            className={`text-gray-700 hover:text-green-600 transition ${isActive("/") ? "text-green-600 font-medium" : ""}`}
          >
            Home
          </Link>
          {isLoggedIn && (
            <>
              <Link 
                href="/dashboard" 
                className={`text-gray-700 hover:text-green-600 transition ${isActive("/dashboard") ? "text-green-600 font-medium" : ""}`}
              >
                Dashboard
              </Link>
              <Link 
                href="/chat" 
                className={`text-gray-700 hover:text-green-600 transition ${isActive("/chat") ? "text-green-600 font-medium" : ""}`}
              >
                Explore
              </Link>
              <Link 
                href="/history" 
                className={`text-gray-700 hover:text-green-600 transition ${isActive("/history") ? "text-green-600 font-medium" : ""}`}
              >
                History
              </Link>
            </>
          )}
          <Link 
            href="/resources" 
            className={`text-gray-700 hover:text-green-600 transition ${isActive("/resources") ? "text-green-600 font-medium" : ""}`}
          >
            Resources
          </Link>
          <Link 
            href="/about" 
            className={`text-gray-700 hover:text-green-600 transition ${isActive("/about") ? "text-green-600 font-medium" : ""}`}
          >
            About
          </Link>
        </nav>
        
        {/* Authentication Buttons/User Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
          ) : isLoggedIn ? (
            <div className="relative" data-dropdown>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                className="flex items-center space-x-2 text-gray-700 hover:text-green-600"
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-700 font-medium">
                    {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                  </span>
                </div>
                <span>{formatEmail(userEmail)}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                  <div className="py-1">
                    <Link 
                      href="/dashboard" 
                      onClick={() => setDropdownOpen(false)} 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/history" 
                      onClick={() => setDropdownOpen(false)} 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Response History
                    </Link>
                    <button 
                      onClick={() => {
                        setDropdownOpen(false);
                        handleSignOut();
                      }} 
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link 
                href="/login" 
                className="text-gray-700 hover:text-green-600 transition"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700 focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 mt-4 pt-4 pb-6 px-4 shadow-lg">
          <nav className="flex flex-col space-y-4">
            <Link 
              href="/" 
              className={`text-gray-700 hover:text-green-600 ${isActive("/") ? "text-green-600 font-medium" : ""}`}
            >
              Home
            </Link>
            {isLoggedIn && (
              <>
                <Link 
                  href="/dashboard" 
                  className={`text-gray-700 hover:text-green-600 ${isActive("/dashboard") ? "text-green-600 font-medium" : ""}`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/chat" 
                  className={`text-gray-700 hover:text-green-600 ${isActive("/chat") ? "text-green-600 font-medium" : ""}`}
                >
                  Explore
                </Link>
                <Link 
                  href="/history" 
                  className={`text-gray-700 hover:text-green-600 ${isActive("/history") ? "text-green-600 font-medium" : ""}`}
                >
                  History
                </Link>
              </>
            )}
            <Link 
              href="/resources" 
              className={`text-gray-700 hover:text-green-600 ${isActive("/resources") ? "text-green-600 font-medium" : ""}`}
            >
              Resources
            </Link>
            <Link 
              href="/about" 
              className={`text-gray-700 hover:text-green-600 ${isActive("/about") ? "text-green-600 font-medium" : ""}`}
            >
              About
            </Link>
            
            <div className="pt-4 mt-4 border-t border-gray-200">
              {loading ? (
                <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : isLoggedIn ? (
                <>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 font-medium">
                        {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                      </span>
                    </div>
                    <span className="text-gray-700">{formatEmail(userEmail)}</span>
                  </div>
                  <button 
                    onClick={handleSignOut} 
                    className="w-full py-2 bg-red-100 text-red-700 rounded text-center"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link 
                    href="/login" 
                    className="w-full py-2 bg-gray-100 text-gray-700 rounded text-center"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/signup" 
                    className="w-full py-2 bg-green-500 text-white rounded text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}