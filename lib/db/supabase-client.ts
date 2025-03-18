// lib/db/supabase-client.ts - FIXED
import { createClient } from "@supabase/supabase-js";

// Check for environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  console.error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Create Supabase client with proper type assertion
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Add better error handling and debug info
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Auth state changed: ${event}`, session ? `User: ${session.user.id}` : 'No session');
});

export default supabase;