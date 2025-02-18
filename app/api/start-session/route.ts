import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { philosophicalRoots } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    // 🔹 Generate a unique user ID
    const userId = uuidv4();
    const initialRoot = philosophicalRoots[0]; // first topic

    // 🔹 Upsert the session into the `progress` table
    // If a row for this userId already exists, it will be overwritten
    const { error } = await supabase
      .from("progress")
      .upsert({
        user_id: userId,
        root: initialRoot,
        root_index: 0,
        status: "in_progress",
        responses_count: 0,
        contradictions: false,
        last_updated: new Date().toISOString(),
      });

    if (error) {
      console.error("❌ Error starting session:", error);
      throw error;
    }

    return NextResponse.json(
      {
        message: "Session started successfully",
        userId,
        root: initialRoot,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("🚨 Error creating user session:", error);
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}
