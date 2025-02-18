import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { checkForContradictions } from "@/lib/ollama"; // <-- We'll create this in ollama.ts

function isValidUUID(uuid: string) {
  return /^[0-9a-fA-F-]{36}$/.test(uuid);
}

export async function POST(req: NextRequest) {
  try {
    const { userId, questionId, answer } = await req.json();

    if (!userId || !questionId || typeof answer !== "string" || answer.trim() === "") {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    // 1) Fetch the user's current progress
    const { data: progress, error: progressError } = await supabase
      .from("progress")
      .select("root, responses_count, contradictions")
      .eq("user_id", userId)
      .maybeSingle();

    if (progressError) throw progressError;
    if (!progress) {
      return NextResponse.json({ error: "No active progress found for user" }, { status: 400 });
    }

    // 2) Insert the new response
    const { error: insertErr } = await supabase.from("responses").insert([
      { user_id: userId, question_id: questionId, answer: answer.trim() },
    ]);
    if (insertErr) throw insertErr;

    // 3) Check for contradictions using the new answer
    const contradictionResult = await checkForContradictions(userId, answer.trim());
    if (contradictionResult.found) {
      // a) set progress.contradictions = true
      const { error: updateErr } = await supabase
        .from("progress")
        .update({ contradictions: true })
        .eq("user_id", userId);

      if (updateErr) throw updateErr;

      return NextResponse.json(
        {
          message: "Response recorded, but contradiction detected!",
          contradictionDetails: contradictionResult.details,
        },
        { status: 200 }
      );
    }

    // 4) If no contradiction, increment the response count
    const newCount = (progress.responses_count || 0) + 1;
    const { error: countErr } = await supabase
      .from("progress")
      .update({ responses_count: newCount })
      .eq("user_id", userId);

    if (countErr) throw countErr;

    return NextResponse.json({ message: "Response recorded successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error handling response:", error);
    return NextResponse.json({ error: "Failed to handle response" }, { status: 500 });
  }
}
