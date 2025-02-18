import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

// Optionally, create a quick UUID check:
function isValidUUID(uuid: string) {
  return /^[0-9a-fA-F-]{36}$/.test(uuid);
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ error: "Invalid or missing userId" }, { status: 400 });
    }

    // 1) Delete from responses
    await supabase.from("responses").delete().eq("user_id", userId);

    // 2) Delete from progress
    await supabase.from("progress").delete().eq("user_id", userId);

    return NextResponse.json({ message: "Session reset successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error resetting session:", error);
    return NextResponse.json({ error: "Failed to reset session" }, { status: 500 });
  }
}
