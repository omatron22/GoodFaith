import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { checkResolution } from "@/lib/ollama";

function isValidUUID(uuid: string) {
  return /^[0-9a-fA-F-]{36}$/.test(uuid);
}

export async function POST(req: NextRequest) {
  try {
    // 1) user sends { userId, resolutionText }
    const { userId, resolutionText } = await req.json();

    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }
    if (!resolutionText || typeof resolutionText !== "string") {
      return NextResponse.json({ error: "Missing or invalid resolution text" }, { status: 400 });
    }

    // 2) Check the resolution with the LLM
    const resolved = await checkResolution(userId, resolutionText.trim());

    if (resolved) {
      // => Contradiction resolved
      const { error: updateError } = await supabase
        .from("progress")
        .update({ contradictions: false })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      return NextResponse.json({ message: "Contradiction resolved" }, { status: 200 });
    } else {
      // => Still contradictory
      return NextResponse.json(
        {
          message: "Your explanation did not resolve the contradiction. Please refine further.",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error resolving contradiction:", error);
    return NextResponse.json({ error: "Failed to resolve contradiction" }, { status: 500 });
  }
}
