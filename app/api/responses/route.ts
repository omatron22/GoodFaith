// app/api/responses/route.ts - FIXED
import { NextRequest, NextResponse } from "next/server";
import { getResponses, updateResponse } from "@/lib/db";
import { checkForContradictions } from "@/lib/ai";
import { supabase } from "@/lib/db/supabase-client";

/**
 * GET /api/responses
 * Query params: includeSuperseded (optional, defaults to false)
 * Retrieves all of a user's responses.
 */
export async function GET(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // If no token provided in header, try to get from session
    if (!token) {
      console.log("No token provided in header, checking session");
      // Verify authentication using Supabase client
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Auth error or no user:", authError);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const userId = user.id;
      const { searchParams } = new URL(request.url);
      const includeSuperseded = searchParams.get("includeSuperseded") === "true";

      const responses = await getResponses(userId, includeSuperseded);
      return NextResponse.json({ responses });
    } else {
      // Use the token provided in header to get user
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        console.error("Auth error with provided token:", error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const userId = data.user.id;
      const { searchParams } = new URL(request.url);
      const includeSuperseded = searchParams.get("includeSuperseded") === "true";

      const responses = await getResponses(userId, includeSuperseded);
      return NextResponse.json({ responses });
    }
  } catch (error) {
    console.error("Error in GET /api/responses:", error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}

/**
 * PATCH /api/responses
 * Body: { responseId: string, answer: string }
 * Updates a response with the user's answer and checks for contradictions.
 */
export async function PATCH(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    let userId: string;
    
    // If no token provided in header, try to get from session
    if (!token) {
      // Verify authentication using Supabase client
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;
    } else {
      // Use the token provided in header to get user
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }
    
    const { responseId, answer } = await request.json();

    if (!responseId || !answer) {
      return NextResponse.json({ error: "Missing responseId or answer" }, { status: 400 });
    }

    // 1) Update the DB with the user's answer
    const updated = await updateResponse(responseId, { answer });
    if (!updated) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    // 2) Check for contradictions
    const { found, details } = await checkForContradictions(userId, answer);

    return NextResponse.json({
      contradiction: found,
      details: found ? details : null,
    });
  } catch (error) {
    console.error("Error in PATCH /api/responses:", error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}