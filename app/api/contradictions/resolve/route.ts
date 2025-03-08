import { NextRequest, NextResponse } from "next/server";
import { resolveContradictions } from "@/lib/ollama";

/**
 * POST /api/contradictions/resolve
 * Body: { userId: string }
 * Calls resolveContradictions(userId) to get a clarifying question about the conflict.
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
