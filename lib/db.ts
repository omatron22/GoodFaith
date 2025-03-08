// db.ts
import { createClient } from "@supabase/supabase-js";

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ------------------------------------------------------------------
    PROGRESS TABLE HELPERS
   ------------------------------------------------------------------ */

/**
 * Fetch a user's progress row by user_id.
 * Returns null if not found.
 */
export async function getProgress(userId: string) {
  const { data, error } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", userId)
    .single();

  // If there's an error but it's not a "row not found" code, throw
  if (error && error.code !== "PGRST116") {
    console.error("Error fetching progress:", error);
    throw error;
  }

  return data; // could be null if no row found
}

/**
 * Initialize a progress row for a user (if it doesn't exist).
 */
export async function initProgress(userId: string) {
  const existing = await getProgress(userId);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("progress")
    .insert([{ user_id: userId }]) // let defaults handle stage_number, etc.
    .single();

  if (error) {
    console.error("Error creating progress row:", error);
    throw error;
  }

  return data;
}

/**
 * Update an existing progress row.
 * Automatically sets 'last_updated' to current timestamp.
 */
export async function updateProgress(
  userId: string,
  updates: Partial<{
    stage_number: number;
    status: string;
    responses_count: number;
    contradictions: boolean;
  }>
) {
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

  return data;
}

/**
 * Increment the 'responses_count' field, useful after adding a new response.
 */
export async function incrementResponseCount(userId: string) {
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

/**
 * Saves a user's response to the "responses" table.
 * - questionText: the final question text shown to the user
 * - answer: the user's typed answer (can be empty if not answered yet)
 * - stageNumber, version, superseded, contradictionFlag all optional
 *
 * Example usage:
 * await saveResponse({
 *   userId: "abc123",
 *   questionText: "Adapted question for stage 2",
 *   answer: "Some answer or empty",
 *   stageNumber: 2,
 * });
 */
export async function saveResponse({
  userId,
  questionText,
  answer,
  stageNumber = 1,
  version = 1,
  superseded = false,
  contradictionFlag = false,
}: {
  userId: string;
  questionText: string;
  answer?: string;
  stageNumber?: number;
  version?: number;
  superseded?: boolean;
  contradictionFlag?: boolean;
}) {
  const insertObj: any = {
    user_id: userId,
    question_text: questionText,
    stage_number: stageNumber,
    version,
    superseded,
    contradiction_flag: contradictionFlag,
  };

  // Only set answer if provided (otherwise it stays null)
  if (answer !== undefined) {
    insertObj.answer = answer;
  }

  const { data, error } = await supabase
    .from("responses")
    .insert([insertObj]);

  if (error) {
    console.error("Error saving response:", error);
    throw error;
  }

  // Optionally increment the user's response count
  await incrementResponseCount(userId);
  return data;
}

/**
 * Fetch all responses (non-superseded by default) for a user.
 */
export async function getResponses(userId: string, includeSuperseded = false) {
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

  return data;
}

/**
 * Fetch a single response by its primary key (id).
 */
export async function getResponseById(id: string) {
  const { data, error } = await supabase
    .from("responses")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching response by id:", error);
    throw error;
  }

  return data;
}

/**
 * Update a response row (e.g., set 'answer', superseded, contradiction_flag, etc.).
 */
export async function updateResponse(
  responseId: string,
  updates: Partial<{
    question_text: string;
    answer: string;
    stage_number: number;
    version: number;
    superseded: boolean;
    contradiction_flag: boolean;
  }>
) {
  const { data, error } = await supabase
    .from("responses")
    .update(updates)
    .eq("id", responseId)
    .single();

  if (error) {
    console.error("Error updating response:", error);
    throw error;
  }

  return data;
}

/**
 * Mark/unmark a specific response as contradictory.
 */
export async function markContradiction(responseId: string, isContradictory = true) {
  return updateResponse(responseId, { contradiction_flag: isContradictory });
}

/**
 * Replace an old contradictory response with a new version.
 * 1) Mark the old one as superseded
 * 2) Insert a new row with version=old.version+1, new answer, etc.
 */
export async function replaceResponseWithNewVersion(responseId: string, newAnswer: string) {
  // 1) Fetch existing row
  const existing = await getResponseById(responseId);
  if (!existing) {
    throw new Error("Response not found for ID: " + responseId);
  }

  // 2) Mark old row as superseded
  await updateResponse(responseId, { superseded: true });

  // 3) Insert new row with incremented version
  const newVersion = (existing.version || 1) + 1;

  const { user_id, question_text, stage_number } = existing;

  await supabase
    .from("responses")
    .insert([
      {
        user_id,
        question_text,
        stage_number,
        answer: newAnswer,
        version: newVersion,
        superseded: false,
        contradiction_flag: false,
      },
    ]);
}
