import { NextRequest, NextResponse } from "next/server";
import { generateFinalEvaluation } from "@/lib/ollama";

/**
 * POST /api/progress/final
 * Body: { userId: string }
 * Calls generateFinalEvaluation(userId) to produce an end-of-journey moral analysis.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const summary = await generateFinalEvaluation(userId);
    return NextResponse.json({ summary });
  } catch (error: unknown) {
    let errorMessage = "An unexpected error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
