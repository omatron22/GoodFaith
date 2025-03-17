import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/global.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoodFaith - Moral Framework Explorer",
  description: "Explore your moral frameworks through interactive questions and AI analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Explore your moral frameworks through interactive questions and AI analysis." />
        <title>GoodFaith</title>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 flex flex-col min-h-screen`}
      >
        {/* Header */}
        <header className="w-full py-4 bg-white shadow-md fixed top-0 z-50">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-semibold hover:text-green-500 transition">
              <span className="text-green-500">Good</span>Faith
            </Link>
            
            <nav className="hidden sm:flex space-x-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-green-600 transition">
                Dashboard
              </Link>
              <Link href="/chat" className="text-gray-700 hover:text-green-600 transition">
                Explore
              </Link>
              <Link href="/resources" className="text-gray-700 hover:text-green-600 transition">
                Resources
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-sm text-gray-700 hover:text-green-600 transition"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="text-sm px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 mt-16 pt-4">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full py-6 bg-white border-t border-gray-200 mt-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <Link href="/" className="text-xl font-semibold">
                  <span className="text-green-500">Good</span>Faith
                </Link>
                <p className="text-sm text-gray-600 mt-1">
                  Explore your moral frameworks through interactive questions.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
                <Link href="/about" className="text-gray-600 hover:text-green-600 transition">
                  About
                </Link>
                <Link href="/privacy" className="text-gray-600 hover:text-green-600 transition">
                  Privacy
                </Link>
                <Link href="/terms" className="text-gray-600 hover:text-green-600 transition">
                  Terms
                </Link>
                <Link href="/contact" className="text-gray-600 hover:text-green-600 transition">
                  Contact
                </Link>
              </div>
            </div>
            
            <div className="border-t border-gray-200 mt-6 pt-6 text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} GoodFaith. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}