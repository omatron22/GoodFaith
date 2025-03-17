import { NextRequest, NextResponse } from "next/server";
import { replaceResponseWithNewVersion } from "@/lib/db";
import { supabase } from "@/lib/db";

/**
 * POST /api/responses/edit
 * Body: { responseId: string, newAnswer: string }
 * Supersedes an old response and creates a new version with the updated answer.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { responseId, newAnswer } = await request.json();

    if (!responseId || !newAnswer) {
      return NextResponse.json({ error: "Missing responseId or newAnswer" }, { status: 400 });
    }

    await replaceResponseWithNewVersion(responseId, newAnswer);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    let errorMessage = "An unexpected error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}