import { NextRequest, NextResponse } from "next/server";
import { generateNextQuestion } from "@/lib/ollama";

/**
 * POST /api/questions
 * Body: { userId: string }
 * Returns { question: string } (the newly generated question text)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId }: { userId?: string } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const question = await generateNextQuestion(userId);
    return NextResponse.json({ question });
  } catch (error: unknown) {
    let errorMessage = "An unexpected error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
