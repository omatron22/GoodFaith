// app/api/questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateNextQuestion } from "@/lib/ai";

/**
 * POST /api/questions
 * Generates the next moral question for the user based on their stage.
 */
export async function POST(request: NextRequest) {
  try {
    // Get user ID from the request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("Generating question for user:", userId);
    
    const { question, responseId } = await generateNextQuestion(userId);
    return NextResponse.json({ question, responseId });
  } catch (error: unknown) {
    console.error("Error in POST /api/questions:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}