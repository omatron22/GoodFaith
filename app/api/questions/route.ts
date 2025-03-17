// app/api/questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateNextQuestion } from "@/lib/ai";
import { supabase } from "@/lib/db/supabase-client";

/**
 * POST /api/questions
 * Generates the next moral question for the user based on their stage.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: NextRequest) {
  try {
    // First, verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const userId = user.id;
    
    // Generate the next question for this user
    const { question, responseId } = await generateNextQuestion(userId);
    return NextResponse.json({ question, responseId });
  } catch (error: unknown) {
    let errorMessage = "An unexpected error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error("Error generating question:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}