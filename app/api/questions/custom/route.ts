import { NextRequest, NextResponse } from "next/server";
import { generateCustomQuestion } from "@/lib/ai";

/**
 * POST /api/questions/custom
 * Body: { userId: string, theme: string }
 * Generates a custom moral question based on the requested theme.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, theme } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!theme || theme.trim() === "") {
      return NextResponse.json({ error: "Missing theme" }, { status: 400 });
    }

    const { question, responseId } = await generateCustomQuestion(userId, theme);
    return NextResponse.json({ question, responseId });
  } catch (error: unknown) {
    let errorMessage = "An unexpected error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}