import { NextRequest, NextResponse } from "next/server";
import { getProgress, initProgress, updateProgress } from "@/lib/db";
import { isValidUUID } from "@/lib/utils"; // Import UUID validation

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId || !isValidUUID(userId)) {
    return NextResponse.json({ error: "Invalid or missing userId" }, { status: 400 });
  }

  try {
    const progress = await getProgress(userId);
    if (!progress) {
      const newProgress = await initProgress(userId);
      return NextResponse.json({ progress: newProgress });
    }
    return NextResponse.json({ progress });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/progress
 * Body: { userId, stage_number?, status?, contradictions?, reset? etc. }
 * Updates the user's progress row. Could also handle "reset session."
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...updates } = body;
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Optional "reset" logic
    if (updates.reset === true) {
      // e.g., set stage_number=1, responses_count=0
      // or remove old responses
      // custom logic up to you
    }

    const newProgress = await updateProgress(userId, updates);
    return NextResponse.json({ progress: newProgress });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
