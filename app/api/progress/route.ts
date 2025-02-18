import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { philosophicalRoots } from "@/lib/constants";

// ✅ Function to Validate UUID
function isValidUUID(uuid: string) {
  return /^[0-9a-fA-F-]{36}$/.test(uuid);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ error: "Invalid or missing user ID" }, { status: 400 });
    }

    // ✅ Fetch user's progress
    const { data: progress, error: progressError } = await supabase
      .from("progress")
      .select("root, status, responses_count, contradictions")
      .eq("user_id", userId)
      .maybeSingle();

    if (progressError) throw progressError;

    // ✅ Initialize progress if missing
    if (!progress) {
      const newRoot = philosophicalRoots[0]; // Start with the first topic
      const { error: insertError } = await supabase
        .from("progress")
        .insert([{
          user_id: userId,
          root: newRoot,
          status: "in_progress",
          responses_count: 0,
          contradictions: false, // ✅ Set contradictions to false
          last_updated: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      return NextResponse.json({
        message: "User progress initialized.",
        topic: newRoot,
        responsesCount: 0,
        contradictions: false
      }, { status: 200 });
    }

    return NextResponse.json(progress, { status: 200 });
  } catch (error) {
    console.error("Error fetching/updating progress:", error);
    return NextResponse.json({ error: "Failed to retrieve or initialize progress" }, { status: 500 });
  }
}
