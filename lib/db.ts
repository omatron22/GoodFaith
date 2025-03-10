// db.ts
import { createClient } from "@supabase/supabase-js";

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ------------------------------------------------------------------
    PROGRESS TABLE HELPERS
   ------------------------------------------------------------------ */

interface Progress {
  user_id: string;
  stage_number?: number;
  status?: string;
  responses_count?: number;
  contradictions?: boolean;
  last_updated?: string;
}

/**
 * Fetch a user's progress row by user_id.
 * Returns null if not found.
 */
export async function getProgress(userId: string): Promise<Progress | null> {
  const { data, error } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching progress:", error);
    throw error;
  }

  return data ?? null;
}

/**
 * Initialize a progress row for a user (if it doesn't exist).
 */
export async function initProgress(userId: string): Promise<Progress> {
  const existing = await getProgress(userId);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("progress")
    .insert([{ user_id: userId }])
    .single();

  if (error) {
    console.error("Error creating progress row:", error);
    throw error;
  }

  return data!;
}

/**
 * Update an existing progress row.
 */
export async function updateProgress(
  userId: string,
  updates: Partial<Omit<Progress, "user_id">>
): Promise<Progress> {
  const { data, error } = await supabase
    .from("progress")
    .update({
      ...updates,
      last_updated: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error updating progress:", error);
    throw error;
  }

  return data!;
}

/**
 * Increment the 'responses_count' field, useful after adding a new response.
 */
export async function incrementResponseCount(userId: string): Promise<Progress> {
  const progress = await getProgress(userId);
  if (!progress) {
    await initProgress(userId);
  }

  const currentCount = progress?.responses_count ?? 0;
  return updateProgress(userId, { responses_count: currentCount + 1 });
}

/* ------------------------------------------------------------------
    RESPONSES TABLE HELPERS
   ------------------------------------------------------------------ */

interface ResponseEntry {
  id?: string;
  user_id: string;
  question_text: string;
  answer?: string;
  stage_number?: number;
  version?: number;
  superseded?: boolean;
  contradiction_flag?: boolean;
}

/**
 * Saves a user's response to the "responses" table.
 */
export async function saveResponse(responseData: ResponseEntry): Promise<ResponseEntry[]> {
  const insertObj: Record<string, unknown> = { ...responseData };

  const { data, error } = await supabase
    .from("responses")
    .insert([insertObj]);

  if (error) {
    console.error("Error saving response:", error);
    throw error;
  }

  await incrementResponseCount(responseData.user_id);
  return data!;
}

/**
 * Fetch all responses (non-superseded by default) for a user.
 */
export async function getResponses(userId: string, includeSuperseded = false): Promise<ResponseEntry[]> {
  const query = supabase
    .from("responses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (!includeSuperseded) {
    query.eq("superseded", false);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching responses:", error);
    throw error;
  }

  return data!;
}

/**
 * Fetch a single response by its primary key (id).
 */
export async function getResponseById(id: string): Promise<ResponseEntry | null> {
  const { data, error } = await supabase
    .from("responses")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching response by id:", error);
    throw error;
  }

  return data ?? null;
}

/**
 * Update a response row.
 */
export async function updateResponse(
  responseId: string,
  updates: Partial<Omit<ResponseEntry, "id" | "user_id">>
): Promise<ResponseEntry> {
  const { data, error } = await supabase
    .from("responses")
    .update(updates)
    .eq("id", responseId)
    .single();

  if (error) {
    console.error("Error updating response:", error);
    throw error;
  }

  return data!;
}

/**
 * Mark/unmark a specific response as contradictory.
 */
export async function markContradiction(responseId: string, isContradictory = true): Promise<ResponseEntry> {
  return updateResponse(responseId, { contradiction_flag: isContradictory });
}

/**
 * Replace an old contradictory response with a new version.
 */
export async function replaceResponseWithNewVersion(responseId: string, newAnswer: string): Promise<void> {
  const existing = await getResponseById(responseId);
  if (!existing) {
    throw new Error("Response not found for ID: " + responseId);
  }

  await updateResponse(responseId, { superseded: true });

  const newVersion = (existing.version || 1) + 1;

  await supabase
    .from("responses")
    .insert([
      {
        user_id: existing.user_id,
        question_text: existing.question_text,
        stage_number: existing.stage_number,
        answer: newAnswer,
        version: newVersion,
        superseded: false,
        contradiction_flag: false,
      },
    ]);
}
