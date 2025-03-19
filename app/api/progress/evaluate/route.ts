// app/api/progress/evaluate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { evaluateAndProgressStage } from "@/lib/db";
import { supabase } from "@/lib/db/supabase-client";

/**
 * POST /api/progress/evaluate
 * Evaluates current stage answers and determines if user should progress to next stage
 */
export async function POST(request: NextRequest) {
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
    console.log("Evaluating stage progression for user:", userId);
    
    try {
      const progress = await evaluateAndProgressStage(userId);
      return NextResponse.json({ progress });
    } catch (error: unknown) {
      let errorMessage = "An unexpected error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error("Stage progression error:", error);
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