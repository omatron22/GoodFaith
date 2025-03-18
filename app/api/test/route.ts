// app/api/test/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase-client";

export async function GET() {
  try {
    // Get auth user
    const { data: authData } = await supabase.auth.getUser();
    console.log("Auth data:", authData);
    
    if (!authData.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Try a direct database query
    const { data, error } = await supabase
      .from("progress")
      .insert([
        {
          user_id: authData.user.id,
          stage_number: 1,
          status: 'active',
          responses_count: 0,
          contradictions: false,
          completed_stages: [],
          last_updated: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) {
      console.error("Direct insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data, user: authData.user });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}