import { NextRequest, NextResponse } from "next/server";
import { getResponses, updateResponse } from "@/lib/db";
import { checkForContradictions } from "@/lib/ollama";

/**
 * GET /api/responses?userId=xxx&includeSuperseded=(true|false)
 * Returns the user's entire conversation or only non-superseded entries.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const includeSuperseded = searchParams.get("includeSuperseded") === "true";

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const responses = await getResponses(userId, includeSuperseded);
    return NextResponse.json({ responses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/responses
 * Body: { responseId: string, userId: string, answer: string }
 * 1) Updates the row in 'responses' with the user's new answer
 * 2) Calls checkForContradictions(userId, answer)
 * 3) Returns whether a contradiction was found
 */
export async function PATCH(request: NextRequest) {
  try {
    const { responseId, userId, answer } = await request.json();
    if (!responseId || !userId) {
      return NextResponse.json({ error: "Missing responseId or userId" }, { status: 400 });
    }

    // 1) Update the DB with the user's answer
    const updated = await updateResponse(responseId, { answer });
    if (!updated) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    // 2) Check for contradictions
    const { found, details } = await checkForContradictions(userId, answer);

    return NextResponse.json({
      contradiction: found,
      details: found ? details : null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
