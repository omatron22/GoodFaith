import { NextRequest, NextResponse } from "next/server";
import { generateFinalEvaluation } from "@/lib/ai";

/**
 * POST /api/progress/final
 * Body: { userId: string }
 * Generates a comprehensive analysis of the user's moral framework.
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