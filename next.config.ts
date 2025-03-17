import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_OLLAMA_URL: process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434',
    NEXT_PUBLIC_OLLAMA_MODEL: process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'deepseek-r1',
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/login',
        permanent: false,
        missing: [
          {
            type: 'cookie',
            key: 'supabase-auth-token',
          },
        ],
      },
      {
        source: '/chat',
        destination: '/login',
        permanent: false,
        missing: [
          {
            type: 'cookie',
            key: 'supabase-auth-token',
          },
        ],
      },
    ];
  },
};

export default nextConfig;