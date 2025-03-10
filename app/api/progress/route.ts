import { NextRequest, NextResponse } from "next/server";
import { getProgress, initProgress, updateProgress } from "@/lib/db";
import { supabase } from "@/lib/db"; // Ensure this imports the authenticated client

export async function GET() {
  // ✅ Retrieve user session from Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id; // Use authenticated user ID

  const progress = await getProgress(userId);
  if (!progress) {
    const newProgress = await initProgress(userId);
    return NextResponse.json({ progress: newProgress });
  }
  return NextResponse.json({ progress });
}

/**
 * PATCH /api/progress
 * Updates the user's progress row.
 */
export async function PATCH(request: NextRequest) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const body = await request.json();
  const updates = body;

  const newProgress = await updateProgress(userId, updates);
  return NextResponse.json({ progress: newProgress });
}
