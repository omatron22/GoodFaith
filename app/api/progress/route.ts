// app/api/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProgress, initProgress, updateProgress } from "@/lib/db";

/**
 * GET /api/progress
 * Retrieves the authenticated user's progress.
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from the request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await getProgress(userId);
    if (!progress) {
      console.log("No progress found, initializing new progress");
      const newProgress = await initProgress(userId);
      return NextResponse.json({ progress: newProgress });
    }
    return NextResponse.json({ progress });
  } catch (error: unknown) {
    console.error("Error in GET /api/progress:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * PATCH /api/progress
 * Updates the authenticated user's progress.
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get user ID from the request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const updates = await request.json();
    const newProgress = await updateProgress(userId, updates);
    return NextResponse.json({ progress: newProgress });
  } catch (error: unknown) {
    console.error("Error in PATCH /api/progress:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}