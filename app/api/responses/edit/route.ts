import { NextRequest, NextResponse } from "next/server";
import { replaceResponseWithNewVersion } from "@/lib/db";

/**
 * POST /api/responses/edit
 * Body: { responseId: string, newAnswer: string }
 * 1) Supersedes the old response
 * 2) Inserts a new row with version=old.version+1 and answer=newAnswer
 */
export async function POST(request: NextRequest) {
  try {
    const { responseId, newAnswer }: { responseId?: string; newAnswer?: string } = 
      await request.json();

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
