import React from "react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        <span className="text-green-500">About</span> GoodFaith
      </h1>
      
      <div className="prose prose-lg max-w-none">
        <h2>Our Mission</h2>
        <p>
          GoodFaith is dedicated to helping individuals explore and understand their moral reasoning framework. 
          We believe that by reflecting on ethical dilemmas and examining our own reasoning processes, we can 
          develop more consistent, thoughtful approaches to the moral challenges we face in everyday life.
        </p>
        
        <h2>The Science Behind GoodFaith</h2>
        <p>
          Our approach is based on Lawrence Kohlberg&apos;s stages of moral development, a psychological framework 
          that describes how moral reasoning develops through six distinct stages across three levels:
        </p>
        
        <h3>Pre-conventional Level (Stages 1-2)</h3>
        <ul>
          <li><strong>Stage 1: Obedience and Punishment Orientation</strong> - Where rules are obeyed to avoid punishment</li>
          <li><strong>Stage 2: Self-Interest Orientation</strong> - Where the right action is defined by what serves one&apos;s own needs</li>
        </ul>
        
        <h3>Conventional Level (Stages 3-4)</h3>
        <ul>
          <li><strong>Stage 3: Interpersonal Accord and Conformity</strong> - Where the right is defined by social expectations and relationships</li>
          <li><strong>Stage 4: Authority and Social-Order Maintaining Orientation</strong> - Where the right is defined by upholding laws and social order</li>
        </ul>
        
        <h3>Post-conventional Level (Stages 5-6)</h3>
        <ul>
          <li><strong>Stage 5: Social Contract Orientation</strong> - Where rules are viewed as social contracts that can be changed for the greater good</li>
          <li><strong>Stage 6: Universal Ethical Principles</strong> - Where abstract principles like justice, dignity, and equality guide moral reasoning</li>
        </ul>
        
        <h2>How GoodFaith Works</h2>
        <p>
          Through a series of thought-provoking questions and AI-guided analysis, GoodFaith helps you:
        </p>
        <ul>
          <li>Explore ethical dilemmas across different contexts</li>
          <li>Identify patterns in your moral reasoning</li>
          <li>Recognize and resolve contradictions in your ethical framework</li>
          <li>Develop a more coherent understanding of your own moral principles</li>
        </ul>
        
        <h2>Our Team</h2>
        <p>
          GoodFaith was created by a team of developers, philosophers, and educators passionate about
          ethical reasoning and personal growth. We believe that technology, when thoughtfully applied,
          can help us better understand ourselves and make more consistent ethical choices.
        </p>
        
        <h2>Get Started</h2>
        <p>
          Ready to explore your moral framework? Sign up today and begin your journey of
          ethical self-discovery.
        </p>
        
        <div className="mt-8 flex justify-center">
          <Link 
            href="/signup" 
            className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg hover:bg-green-600 hover:scale-105 transition transform"
          >
            Start Your Journey
          </Link>
        </div>
      </div>
    </div>
  );
}