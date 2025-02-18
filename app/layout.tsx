import type { Metadata } from "next";
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
        <title>GoodFaith</title>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        {/* Header */}
        <header className="w-full py-4 bg-white shadow-md text-center text-lg font-semibold">
          GoodFaith
        </header>

        <main className="flex flex-col items-center justify-center min-h-screen px-4">
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
