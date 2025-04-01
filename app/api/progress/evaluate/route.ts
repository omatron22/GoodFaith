// app/api/progress/evaluate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { evaluateAndProgressStage } from "@/lib/db";

/**
 * POST /api/progress/evaluate
 * Evaluates current stage answers and determines if user should progress to next stage
 */
export async function POST(request: NextRequest) {
  try {
    // Get user ID from the request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("Evaluating stage progression for user:", userId);
    
    const progress = await evaluateAndProgressStage(userId);
    return NextResponse.json({ progress });
  } catch (error: unknown) {
    console.error("Error in POST /api/progress/evaluate:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}