import { NextRequest, NextResponse } from "next/server";
import { getProgress, initProgress, updateProgress } from "@/lib/db";
import { supabase } from "@/lib/db"; 

/**
 * GET /api/progress
 * Retrieves the authenticated user's progress.
 */
export async function GET() {
  // Retrieve user session from Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  try {
    const progress = await getProgress(userId);
    if (!progress) {
      const newProgress = await initProgress(userId);
      return NextResponse.json({ progress: newProgress });
    }
    return NextResponse.json({ progress });
  } catch (error: unknown) {
    let errorMessage = "An unexpected error occurred";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * PATCH /api/progress
 * Updates the authenticated user's progress.
 */
export async function PATCH(request: NextRequest) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  
  try {
    const updates = await request.json();
    const newProgress = await updateProgress(userId, updates);
    return NextResponse.json({ progress: newProgress });
  } catch (error: unknown) {
    let errorMessage = "An unexpected error occurred";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}