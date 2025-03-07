import { NextRequest, NextResponse } from "next/server";
import { generateNextQuestion } from "@/lib/ollama";

/**
 * POST /api/questions
 * Body: { userId: string }
 * Returns { question: string } (the newly generated question text)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const question = await generateNextQuestion(userId);
    return NextResponse.json({ question });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
