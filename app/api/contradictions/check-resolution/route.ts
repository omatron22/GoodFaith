import { NextRequest, NextResponse } from "next/server";
import { checkResolution } from "@/lib/ai";

/**
 * POST /api/contradictions/check-resolution
 * Body: { userId: string, resolutionText: string }
 * Checks if the user's explanation resolves their contradiction.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, resolutionText } = await request.json();
    if (!userId || !resolutionText) {
      return NextResponse.json({ error: "Missing userId or resolutionText" }, { status: 400 });
    }

    const isResolved = await checkResolution(userId, resolutionText);
    return NextResponse.json({ resolved: isResolved });
  } catch (error: unknown) {
    let errorMessage = "An unexpected error occurred";
    
    // Check if error is an instance of Error before accessing error.message
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}