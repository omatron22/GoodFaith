import { NextRequest, NextResponse } from "next/server";
import { generateNextQuestion, resolveContradictions } from "@/lib/ollama";
import { supabase } from "@/lib/db";
import { philosophicalRoots } from "@/lib/constants";

function isValidUUID(uuid: string) {
  return /^[0-9a-fA-F-]{36}$/.test(uuid);
}

interface UserProgress {
  root: string;
  status: string;
  responses_count: number;
  contradictions: boolean;
  root_index: number; // <-- We'll add this to the DB and fetch it
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ error: "Invalid or missing user ID" }, { status: 400 });
    }

    console.log(`🔍 Fetching question for user: ${userId}`);

    // 1) Fetch user's progress (including root_index)
    let { data: progress, error: progressError } = await supabase
      .from("progress")
      .select("root, status, responses_count, contradictions, root_index")
      .eq("user_id", userId)
      .maybeSingle<UserProgress>();

    if (progressError) throw progressError;

    // 2) If no progress, initialize it
    if (!progress) {
      console.warn(`⚠️ No active progress found for user: ${userId}`);

      const newRoot = philosophicalRoots[0];
      const newProgress: Partial<UserProgress> = {
        root: newRoot,
        status: "in_progress",
        responses_count: 0,
        contradictions: false,
        root_index: 0, // start at index 0
      };

      const { error: insertErr } = await supabase.from("progress").insert([
        {
          user_id: userId,
          ...newProgress,
          last_updated: new Date().toISOString(),
        },
      ]);

      if (insertErr) throw insertErr;

      progress = {
        root: newRoot,
        status: "in_progress",
        responses_count: 0,
        contradictions: false,
        root_index: 0,
      };
    }

    // 3) If contradictions exist, fetch a "resolution question"
    if (progress.contradictions) {
      console.log(`⚠️ Contradiction detected for user: ${userId}`);
      const contradictionResolution = await resolveContradictions(userId);
      return NextResponse.json(
        {
          message: "Contradiction detected",
          resolutionQuestion: contradictionResolution,
        },
        { status: 200 }
      );
    }

    // 4) If user has answered 3+ times on this root, move to the next root
    let { responses_count, root_index } = progress;
    if (responses_count >= 3) {
      // Move on
      const newIndex = root_index + 1;
      if (newIndex < philosophicalRoots.length) {
        const nextRoot = philosophicalRoots[newIndex];
        const { error: updateErr } = await supabase
          .from("progress")
          .update({
            root_index: newIndex,
            root: nextRoot,
            responses_count: 0,
          })
          .eq("user_id", userId);

        if (updateErr) throw updateErr;

        // Refresh progress to get the updated fields
        root_index = newIndex;
        responses_count = 0;
      } else {
        // If we've exhausted all roots
        const { error: completeErr } = await supabase
          .from("progress")
          .update({ status: "completed" })
          .eq("user_id", userId);

        if (completeErr) throw completeErr;

        return NextResponse.json(
          { message: "All philosophical roots explored. Session completed." },
          { status: 200 }
        );
      }
    }

    // 5) Use the (possibly updated) root to generate the next question
    const finalRoot = philosophicalRoots[root_index];
    console.log(
      `Generating question for user ${userId}, root_index ${root_index}: ${finalRoot}`
    );

    const generatedQuestion = await generateNextQuestion(userId, finalRoot);

    if (!generatedQuestion || typeof generatedQuestion !== "string") {
      console.error("🚨 Error: Invalid question generated from LLM");
      return NextResponse.json({ error: "Failed to generate a valid question." }, { status: 500 });
    }

    console.log(`✅ Successfully generated question for user: ${userId}`);

    return NextResponse.json(
      {
        topic: finalRoot,
        question: generatedQuestion.trim(),
        responsesCount: responses_count,
        contradictionsExist: progress.contradictions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("🚨 Error generating question:", error);
    return NextResponse.json({ error: "Failed to generate question" }, { status: 500 });
  }
}
