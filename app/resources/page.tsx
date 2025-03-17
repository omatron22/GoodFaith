// app/resources/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Resource categories
const CATEGORIES = [
  "All",
  "Kohlberg",
  "Ethical Frameworks",
  "Classical Philosophy", 
  "Modern Ethics",
  "Practical Ethics"
];

// Resource interface
interface Resource {
  id: string;
  title: string;
  description: string;
  type: "Book" | "Article" | "Video" | "Course" | "Podcast";
  category: string[];
  level: "Beginner" | "Intermediate" | "Advanced";
  url?: string;
  imageUrl?: string;
}

// Sample resources data
const RESOURCES: Resource[] = [
  {
    id: "1",
    title: "The Philosophy of Moral Development",
    description: "Lawrence Kohlberg's classic exploration of the six stages of moral development.",
    type: "Book",
    category: ["Kohlberg", "Ethical Frameworks"],
    level: "Intermediate",
    imageUrl: "/api/placeholder/80/120"
  },
  {
    id: "2",
    title: "Introduction to Kohlberg's Stages of Moral Development",
    description: "A beginner-friendly overview of Kohlberg's research and theory.",
    type: "Article",
    category: ["Kohlberg", "Ethical Frameworks"],
    level: "Beginner",
    url: "https://www.simplypsychology.org/kohlberg.html"
  },
  {
    id: "3",
    title: "Justice: What's the Right Thing to Do?",
    description: "Michael Sandel's famous course exploring justice, ethics, and moral reasoning.",
    type: "Course",
    category: ["Ethical Frameworks", "Modern Ethics", "Practical Ethics"],
    level: "Beginner",
    url: "https://www.youtube.com/playlist?list=PL30C13C91CFFE8B1A"
  },
  {
    id: "4",
    title: "The Nicomachean Ethics",
    description: "Aristotle's timeless exploration of virtue ethics and the good life.",
    type: "Book",
    category: ["Classical Philosophy", "Ethical Frameworks"],
    level: "Advanced",
    imageUrl: "/api/placeholder/80/120"
  },
  {
    id: "5",
    title: "The Trolley Problem and Utilitarianism",
    description: "Explores the famous ethical thought experiment and its implications for consequentialist ethics.",
    type: "Article",
    category: ["Ethical Frameworks", "Modern Ethics"],
    level: "Beginner",
    url: "https://www.philosophybasics.com/branch_utilitarianism.html"
  },
  {
    id: "6",
    title: "Practical Ethics",
    description: "Peter Singer's influential work applying ethical theory to practical issues like poverty, animal rights, and more.",
    type: "Book",
    category: ["Modern Ethics", "Practical Ethics"],
    level: "Intermediate",
    imageUrl: "/api/placeholder/80/120"
  },
  {
    id: "7",
    title: "The Good Place: Philosophy and Ethics in Entertainment",
    description: "How a popular TV show explores complex philosophical concepts in an accessible way.",
    type: "Video",
    category: ["Modern Ethics", "Ethical Frameworks"],
    level: "Beginner",
    url: "https://www.youtube.com/watch?v=lDnO4nDA3kM"
  },
  {
    id: "8",
    title: "Philosophy Bites",
    description: "A podcast featuring interviews with leading philosophers on a wide range of ethical topics.",
    type: "Podcast",
    category: ["Ethical Frameworks", "Classical Philosophy", "Modern Ethics"],
    level: "Intermediate",
    url: "https://philosophybites.com/"
  }
];

export default function ResourcesPage() {
  const [category, setCategory] = useState<string>("All");
  const [level, setLevel] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();
  
  // Filter resources based on selected filters
  const filteredResources = RESOURCES.filter(resource => {
    // Category filter
    const passesCategory = category === "All" || resource.category.includes(category);
    
    // Level filter
    const passesLevel = level === "All" || resource.level === level;
    
    // Search query filter
    const query = searchQuery.toLowerCase();
    const passesSearch = 
      !searchQuery || 
      resource.title.toLowerCase().includes(query) || 
      resource.description.toLowerCase().includes(query);
    
    return passesCategory && passesLevel && passesSearch;
  });
  
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="text-green-500">Moral Philosophy</span> Resources
        </h1>
        <p className="mt-2 text-gray-600">
          Explore these resources to deepen your understanding of moral reasoning and ethical frameworks
        </p>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Category filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          {/* Level filter */}
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <select
              id="level"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Resources grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <div key={resource.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg text-gray-800">{resource.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    resource.type === "Book" ? "bg-blue-100 text-blue-800" :
                    resource.type === "Article" ? "bg-green-100 text-green-800" :
                    resource.type === "Video" ? "bg-red-100 text-red-800" :
                    resource.type === "Course" ? "bg-purple-100 text-purple-800" :
                    "bg-orange-100 text-orange-800"
                  }`}>
                    {resource.type}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {resource.category.map((cat) => (
                    <span key={cat} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {cat}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-medium ${
                    resource.level === "Beginner" ? "text-green-600" :
                    resource.level === "Intermediate" ? "text-blue-600" :
                    "text-purple-600"
                  }`}>
                    {resource.level}
                  </span>
                  
                  {resource.url && (
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:text-green-800 font-medium"
                    >
                      Explore →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-gray-600 font-medium">No matching resources found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your filters or search term</p>
          </div>
        )}
      </div>
      
      {/* Additional info */}
      <div className="bg-green-50 border border-green-100 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">About Kohlberg's Stages</h2>
        <p className="text-gray-700 mb-4">
          Lawrence Kohlberg's theory of moral development outlines six stages across three levels,
          describing how individuals reason about ethical dilemmas throughout their lives.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-green-100">
            <h3 className="font-medium text-green-700">Pre-conventional</h3>
            <p className="text-sm text-gray-600 mt-1">
              Stages 1-2: Focus on obedience, punishment, and self-interest
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-100">
            <h3 className="font-medium text-green-700">Conventional</h3>
            <p className="text-sm text-gray-600 mt-1">
              Stages 3-4: Focus on social norms, relationships, and authority
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-100">
            <h3 className="font-medium text-green-700">Post-conventional</h3>
            <p className="text-sm text-gray-600 mt-1">
              Stages 5-6: Focus on social contracts, universal principles and ethics
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
          ← Back to Dashboard
        </Link>
        
        <Link href="/chat" className="text-green-600 hover:text-green-800">
          Continue Your Journey →
        </Link>
      </div>
    </div>
  );
}