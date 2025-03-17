# GoodFaith Project Setup Guide

GoodFaith is an interactive web application that helps users explore their moral reasoning framework through a series of questions based on Kohlberg's stages of moral development.

## Project Structure

The project follows a Next.js 14 App Router structure:

```
/app                        # Next.js App Router pages
  /(auth)                   # Auth-related routes
    /login                  # Login page
    /signup                 # Signup page
  /api                      # API routes
    /contradictions         # Contradiction handling endpoints
    /progress               # User progress endpoints
    /questions              # Question generation endpoints
    /responses              # User response endpoints
  /about                    # About page
  /chat                     # Main Q&A interface
  /dashboard                # User dashboard
  /history                  # Response history
  /resources                # Educational resources
  /results                  # Analysis results
  /...                      # Other pages

/components                 # Reusable components
  /chat                     # Chat-related components
  /dashboard                # Dashboard components
  /layout                   # Layout components
  /ui                       # Basic UI components

/lib                        # Utility functions and services
  /ai                       # AI/LLM integration
  /db                       # Database utilities
  /utils                    # General utilities

/styles                     # Global styles
/public                     # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account (for database and authentication)
- Ollama-compatible model running locally or on a server

### Environment Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with the following:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434
   NEXT_PUBLIC_OLLAMA_MODEL=deepseek-r1
   ```

### Database Setup

1. Create a new Supabase project
2. Execute the following SQL to set up your tables:

```sql
-- Progress table
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  responses_count INTEGER DEFAULT 0,
  contradictions BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_stages INTEGER[] DEFAULT '{}',
  current_question_id UUID,
  
  UNIQUE(user_id)
);

-- Responses table
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer TEXT,
  stage_number INTEGER,
  version INTEGER DEFAULT 1,
  superseded BOOLEAN DEFAULT false,
  contradiction_flag BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX responses_user_id_idx ON responses(user_id);
CREATE INDEX responses_superseded_idx ON responses(user_id, superseded);

-- Add Row Level Security (RLS) policies
-- This ensures users can only access their own data

-- Progress table policies
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Responses table policies
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own responses"
  ON responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses"
  ON responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses"
  ON responses FOR UPDATE
  USING (auth.uid() = user_id);
```

### LLM Setup

1. Install Ollama from https://ollama.ai/
2. Pull a compatible model:
   ```bash
   ollama pull deepseek-r1
   ```
   (you can also use another model like `llama`, `mistral`, or another compatible model)

3. Run the Ollama server:
   ```bash
   ollama serve
   ```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Key Features

1. **User Authentication**
   - Email/password signup and login via Supabase Auth

2. **Moral Journey**
   - Stage-based questions following Kohlberg's stages
   - AI adapts questions based on user history

3. **Contradiction Detection**
   - AI analyzes response consistency
   - Helps users resolve contradictions in their moral reasoning

4. **Progress Tracking**
   - Dashboard shows journey progress
   - Visual representation of stages completed

5. **Final Analysis**
   - Comprehensive moral framework evaluation
   - Personalized insights and suggested areas for reflection

## File Descriptions

### Core Components

- `app/chat/page.tsx` - Main interface for Q&A interaction
- `app/dashboard/page.tsx` - User progress dashboard
- `app/results/page.tsx` - Final analysis display
- `components/chat/question-card.tsx` - Question display component
- `components/chat/chatbox.tsx` - Conversation history display

### Database Utilities

- `lib/db/index.ts` - Supabase database integration
- Main functions:
  - `getProgress` - Fetch user progress
  - `saveResponse` - Save a user response
  - `getResponses` - Get user's conversation history
  - `getResponsesByStage` - Get responses for a specific stage

### AI Utilities

- `lib/ai/index.ts` - Ollama LLM integration
- Main functions:
  - `generateNextQuestion` - Generate personalized questions
  - `checkForContradictions` - Analyze moral consistency
  - `resolveContradictions` - Help resolve conflicts
  - `generateFinalEvaluation` - Create final analysis

## Deployment

This application can be deployed on Vercel or any other platform supporting Next.js:

1. Connect your Git repository to Vercel
2. Configure environment variables
3. Deploy

## Credits

This project uses:
- Next.js for framework
- Tailwind CSS for styling
- Supabase for database and authentication
- Ollama for local LLM integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.