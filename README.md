# GoodFaith - Moral Framework Explorer

GoodFaith is an interactive web application that helps users explore their moral reasoning framework through a series of questions based on Kohlberg's stages of moral development.

## Features

- **User Authentication** - Secure email/password signup and login via Supabase Auth
- **Stage-Based Questions** - Progress through Kohlberg's six stages of moral development
- **AI-Powered Analysis** - Ollama-powered LLM generates personalized questions and detects contradictions
- **Contradiction Resolution** - Identify and resolve inconsistencies in moral reasoning
- **Progress Tracking** - Visual dashboard showing journey progress and stages completed
- **Final Analysis** - Comprehensive moral framework evaluation with personalized insights

## Tech Stack

- **Frontend**: Next.js 14, React 19, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Authentication)
- **AI Integration**: Ollama (local LLM service)
- **Styling**: Tailwind CSS with custom components
- **Deployment**: Vercel-compatible

## Getting Started

### Prerequisites

- Node.js 18+ installed
- [Supabase](https://supabase.io/) account
- [Ollama](https://ollama.ai/) running locally or on a server

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/goodfaith.git
   cd goodfaith
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment variables file and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

4. Start Ollama with a compatible model:
   ```bash
   ollama pull deepseek-r1  # or another compatible model
   ollama serve
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

### Database Setup

1. Create a new Supabase project
2. Execute the SQL queries in `database/schema.sql` to set up your tables
3. Set up Row Level Security (RLS) policies as described in the README

## Project Structure

```
/app                        # Next.js App Router pages
  /(auth)                   # Auth-related routes
  /api                      # API routes
  /about                    # About page
  /chat                     # Main Q&A interface
  /dashboard                # User dashboard
  ...

/components                 # Reusable components
  /chat                     # Chat-related components
  /layout                   # Layout components
  ...

/lib                        # Utility functions and services
  /ai                       # AI/LLM integration
  /db                       # Database utilities
  /utils                    # General utilities

/styles                     # Global styles
/public                     # Static assets
```

## Key Features Explained

### Moral Journey

The user progresses through questions based on Kohlberg's six stages of moral development:

1. **Obedience and Punishment** - Focus on avoiding punishment
2. **Self-Interest** - Focus on what's in it for me
3. **Interpersonal Accord** - Focus on social approval
4. **Authority and Social Order** - Focus on law and duty
5. **Social Contract** - Focus on agreed-upon rights
6. **Universal Ethical Principles** - Focus on abstract principles

### Contradiction Detection

The AI analyzes responses for contradictions in moral reasoning. When found, it helps users reconcile these contradictions through clarifying questions, promoting more coherent ethical frameworks.

### Final Analysis

After completing multiple questions, the system generates a comprehensive analysis of the user's moral reasoning framework, including:

- Summary of moral reasoning style
- Connection to Kohlberg's framework
- Strengths observed
- Questions for further reflection

## Contributing

Contributions are welcome! Please check out our [contributing guidelines](CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Lawrence Kohlberg for his theory of moral development
- The Supabase team for their excellent database and auth system
- The Ollama project for making local LLMs accessible