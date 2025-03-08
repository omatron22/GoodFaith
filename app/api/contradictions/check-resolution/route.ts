import { NextRequest, NextResponse } from "next/server";
import { checkResolution } from "@/lib/ollama";

/**
 * POST /api/contradictions/check-resolution
 * Body: { userId: string, resolutionText: string }
 * Calls checkResolution(userId, resolutionText) to see if the conflict is resolved.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, resolutionText } = await request.json();
    if (!userId || !resolutionText) {
      return NextResponse.json({ error: "Missing userId or resolutionText" }, { status: 400 });
    }

    const isResolved = await checkResolution(userId, resolutionText);
    return NextResponse.json({ resolved: isResolved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
