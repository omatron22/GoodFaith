import type { Metadata } from "next";
import Link from "next/link"; // ✅ Import Link from Next.js
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
  title: "GoodFaith",
  description: "Explore your moral frameworks through interactive questions.",
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
        <meta name="description" content="Explore your moral frameworks through interactive questions." />
        <title>GoodFaith</title>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 flex flex-col min-h-screen`}
      >
        {/* Header */}
        <header className="w-full py-4 bg-white shadow-md text-center text-lg font-semibold fixed top-0 z-50">
          <Link href="/" className="hover:text-green-500 transition">
            GoodFaith
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 mt-16">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full py-4 bg-gray-100 text-center text-sm">
          &copy; {new Date().getFullYear()} GoodFaith. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
