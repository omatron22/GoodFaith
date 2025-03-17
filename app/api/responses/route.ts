// app/api/responses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getResponses, updateResponse } from "@/lib/db";
import { checkForContradictions } from "@/lib/ai";
import { supabase } from "@/lib/db/supabase-client";

/**
 * GET /api/responses
 * Query params: includeSuperseded (optional, defaults to false)
 * Retrieves all of a user's responses.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const includeSuperseded = searchParams.get("includeSuperseded") === "true";

    const responses = await getResponses(userId, includeSuperseded);
    return NextResponse.json({ responses });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}

/**
 * PATCH /api/responses
 * Body: { responseId: string, answer: string }
 * Updates a response with the user's answer and checks for contradictions.
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = user.id;
    const { responseId, answer } = await request.json();

    if (!responseId || !answer) {
      return NextResponse.json({ error: "Missing responseId or answer" }, { status: 400 });
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
      details: found ? details : null,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}