import React from "react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Privacy Policy
      </h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <p>
          At GoodFaith, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, 
          and safeguard your information when you use our service.
        </p>
        
        <h2>Information We Collect</h2>
        
        <h3>Personal Data</h3>
        <p>
          When you register for an account, we collect:
        </p>
        <ul>
          <li>Email address</li>
          <li>Authentication information</li>
        </ul>
        
        <h3>Usage Data</h3>
        <p>
          We also collect information about how you use our service:
        </p>
        <ul>
          <li>Your responses to moral questions</li>
          <li>Patterns in your moral reasoning</li>
          <li>Device and browser information</li>
          <li>Time spent on the platform</li>
          <li>Pages visited</li>
        </ul>
        
        <h2>How We Use Your Information</h2>
        <p>
          We use the information we collect to:
        </p>
        <ul>
          <li>Provide, maintain, and improve our service</li>
          <li>Generate personalized moral framework analyses</li>
          <li>Detect and resolve contradictions in your responses</li>
          <li>Adapt questions based on your previous answers</li>
          <li>Ensure the security of your account</li>
          <li>Communicate with you about your account or our service</li>
          <li>Improve our algorithms and service quality</li>
        </ul>
        
        <h2>Data Storage and Security</h2>
        <p>
          Your data is stored securely in our Supabase database. We implement appropriate technical and organizational 
          measures to protect your personal information against unauthorized access, accidental loss, or destruction.
        </p>
        
        <h2>AI Analysis and Processing</h2>
        <p>
          GoodFaith uses AI to analyze your responses to moral questions. This analysis is used to:
        </p>
        <ul>
          <li>Generate personalized questions based on your moral reasoning stage</li>
          <li>Identify potential contradictions in your moral framework</li>
          <li>Create a summary analysis of your moral reasoning patterns</li>
        </ul>
        <p>
          Our AI processing is designed to help you better understand your own moral reasoning, not to make judgments 
          about the correctness of your views.
        </p>
        
        <h2>Data Sharing and Third Parties</h2>
        <p>
          We do not sell your personal information to third parties. We may share your information in the following limited circumstances:
        </p>
        <ul>
          <li>With service providers who help us operate our platform (such as hosting providers)</li>
          <li>When required by law or to protect our rights</li>
          <li>With your consent</li>
        </ul>
        
        <h2>Your Rights</h2>
        <p>
          Depending on your location, you may have certain rights regarding your personal information, including:
        </p>
        <ul>
          <li>The right to access the personal information we hold about you</li>
          <li>The right to request correction of inaccurate information</li>
          <li>The right to request deletion of your information</li>
          <li>The right to object to or restrict processing of your information</li>
          <li>The right to data portability</li>
        </ul>
        
        <h2>Children&apos;s Privacy</h2>
        <p>
          Our service is not intended for individuals under the age of 18. We do not knowingly collect personal 
          information from children under 18. If we become aware that we have collected personal information from 
          a child under 18, we will take steps to delete that information.
        </p>
        
        <h2>Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
          Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date.
        </p>
        
        <h2>Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or our data practices, please contact us at:
        </p>
        <ul>
          <li>Via our <a href="/contact" className="text-green-600 hover:text-green-500">contact form</a></li>
          <li>By email: privacy@goodfaith.example.com</li>
        </ul>
      </div>
    </div>
  );
}