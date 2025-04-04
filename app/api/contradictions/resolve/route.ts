import { NextRequest, NextResponse } from "next/server";
import { resolveContradictions } from "@/lib/ai";

/**
 * POST /api/contradictions/resolve
 * Body: { userId: string }
 * Gets a clarifying question to help the user resolve their contradiction.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const question = await resolveContradictions(userId);

    // question is a single open-ended clarifying Q from the LLM
    return NextResponse.json({ question });
  } catch (error: unknown) {
    let errorMessage = "An unexpected error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}