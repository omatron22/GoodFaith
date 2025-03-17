// lib/db/supabase-client.ts
import { createClient } from "@supabase/supabase-js";

// Check for environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Create Supabase client with proper type assertion
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default supabase;