import React from "react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Terms of Service
      </h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the GoodFaith service ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
          If you disagree with any part of the terms, you may not access the Service.
        </p>
        
        <h2>2. Description of Service</h2>
        <p>
          GoodFaith is an interactive platform designed to help users explore and understand their moral reasoning 
          framework through a series of questions, responses, and AI-guided analysis. The Service may evolve over time.
        </p>
        
        <h2>3. User Accounts</h2>
        <p>
          To use certain features of the Service, you must register for an account. You are responsible for maintaining 
          the confidentiality of your account credentials and for all activities that occur under your account.
        </p>
        
        <h2>4. User Content</h2>
        <p>
          Our Service allows you to provide responses to moral questions. By providing responses, you grant us a 
          non-exclusive, worldwide, royalty-free license to use, reproduce, and analyze your responses for the purpose 
          of providing the Service and improving our algorithms.
        </p>
        
        <h2>5. Data Privacy</h2>
        <p>
          Your privacy is important to us. Our <a href="/privacy" className="text-green-600 hover:text-green-500">Privacy Policy</a> describes 
          how we collect, use, and disclose information about you. By using the Service, you consent to the collection 
          and processing of your data as described in our Privacy Policy.
        </p>
        
        <h2>6. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are and will remain the exclusive property 
          of GoodFaith and its licensors. The Service is protected by copyright, trademark, and other laws.
        </p>
        
        <h2>7. Limitations of Liability</h2>
        <p>
          In no event shall GoodFaith, nor its directors, employees, partners, agents, suppliers, or affiliates, be 
          liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, 
          loss of profits, data, use, goodwill, or other intangible losses, resulting from:
        </p>
        <ul>
          <li>Your access to or use of or inability to access or use the Service;</li>
          <li>Any conduct or content of any third party on the Service;</li>
          <li>Any content obtained from the Service; and</li>
          <li>Unauthorized access, use or alteration of your transmissions or content.</li>
        </ul>
        
        <h2>8. Disclaimer</h2>
        <p>
          The Service is provided on an "AS IS" and "AS AVAILABLE" basis. GoodFaith does not warrant that the Service 
          will be uninterrupted, timely, secure, or error-free. Results from the use of the Service are not intended 
          to replace professional advice, including psychological, ethical, or philosophical guidance.
        </p>
        
        <h2>9. Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide 
          notice of any changes by posting the new Terms on this page. Your continued use of the Service after any such 
          changes constitutes your acceptance of the new Terms.
        </p>
        
        <h2>10. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws, without regard to its conflict of 
          law provisions.
        </p>
        
        <h2>11. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please <a href="/contact" className="text-green-600 hover:text-green-500">contact us</a>.
        </p>
      </div>
    </div>
  );
}