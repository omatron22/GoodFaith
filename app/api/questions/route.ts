import { NextRequest, NextResponse } from "next/server";
import { generateNextQuestion } from "@/lib/ai";

/**
 * POST /api/questions
 * Body: { userId: string }
 * Generates the next moral question for the user based on their stage.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { question, responseId } = await generateNextQuestion(userId);
    return NextResponse.json({ question, responseId });
  } catch (error: unknown) {
    let errorMessage = "An unexpected error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}