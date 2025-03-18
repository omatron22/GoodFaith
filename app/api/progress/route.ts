// app/api/progress/route.ts - FIXED
import { NextRequest, NextResponse } from "next/server";
import { getProgress, initProgress, updateProgress } from "@/lib/db";
import { supabase } from "@/lib/db"; 

/**
 * GET /api/progress
 * Retrieves the authenticated user's progress.
 */
export async function GET(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    let user;
    
    // If no token provided in header, try to get from session
    if (!token) {
      // Verify authentication using Supabase client
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        console.error("Auth error or no user:", authError);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      user = data.user;
    } else {
      // Use the token provided in header to get user
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        console.error("Token validation error:", error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      user = data.user;
    }

    const userId = user.id;
    console.log("Fetching progress for user:", userId);

    try {
      const progress = await getProgress(userId);
      if (!progress) {
        console.log("No progress found, initializing new progress");
        const newProgress = await initProgress(userId);
        return NextResponse.json({ progress: newProgress });
      }
      return NextResponse.json({ progress });
    } catch (error: unknown) {
      let errorMessage = "An unexpected error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error("Database error:", error);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error("Auth handling error:", error);
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
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    let userId;
    
    // If no token provided in header, try to get from session
    if (!token) {
      // Verify authentication using Supabase client
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      // Use the token provided in header to get user
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }
    
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
  } catch (error: unknown) {
    console.error("Error in PATCH /api/progress:", error);
    let errorMessage = "An unexpected error occurred";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}