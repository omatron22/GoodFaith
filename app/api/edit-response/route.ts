import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { checkForContradictions } from "@/lib/ollama";

export async function POST(req: NextRequest) {
  try {
    const { userId, responseId, newAnswer } = await req.json();

    if (!userId || !responseId || !newAnswer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1) Find the existing row
    const { data: oldRow, error: fetchErr } = await supabase
      .from("responses")
      .select("*")
      .eq("id", responseId)
      .single();

    if (fetchErr) throw fetchErr;
    if (!oldRow) {
      return NextResponse.json({ error: "No matching response found" }, { status: 404 });
    }

    // 2) Mark the old row as superseded
    const { error: supErr } = await supabase
      .from("responses")
      .update({ superseded: true })
      .eq("id", responseId);
    if (supErr) throw supErr;

    // 3) Insert a new row with version = oldRow.version + 1
    const newVersion = oldRow.version + 1;
    const { error: insertErr } = await supabase.from("responses").insert({
      user_id: oldRow.user_id,
      question_id: oldRow.question_id,
      answer: newAnswer.trim(),
      version: newVersion,
      superseded: false,
    });
    if (insertErr) throw insertErr;

    // 4) Re-check contradictions with the updated set of active answers
    const contradictionResult = await checkForContradictions(userId, newAnswer.trim());
    if (contradictionResult.found) {
      // still contradictory
      const { error: updateErr } = await supabase
        .from("progress")
        .update({ contradictions: true })
        .eq("user_id", userId);
      if (updateErr) throw updateErr;

      return NextResponse.json({
        message: "Response updated, but a contradiction still exists.",
        contradictionDetails: contradictionResult.details,
      });
    } else {
      // no more contradictions
      const { error: clearErr } = await supabase
        .from("progress")
        .update({ contradictions: false })
        .eq("user_id", userId);
      if (clearErr) throw clearErr;

      return NextResponse.json({
        message: "Response updated successfully. No active contradictions.",
      });
    }
  } catch (error) {
    console.error("Error editing response:", error);
    return NextResponse.json({ error: "Failed to edit response" }, { status: 500 });
  }
}
