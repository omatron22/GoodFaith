import { createClient } from "@supabase/supabase-js";

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Saves a user's response to the database
 */
export async function saveResponse(userId: string, questionId: string, response: string) {
  const { error } = await supabase.from("responses").insert([
    { user_id: userId, question_id: questionId, response },
  ]);

  if (error) {
    console.error("Error saving response:", error);
    throw error;
  }
}
