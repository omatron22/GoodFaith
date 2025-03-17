// lib/db/index.ts
import { supabase } from "./supabase-client";
import { isValidUUID } from "../utils";

// Define database types
export interface Progress {
  id?: string;
  user_id: string;
  stage_number: number;
  status: 'active' | 'paused' | 'completed';
  responses_count: number;
  contradictions: boolean;
  last_updated: string;
  completed_stages?: number[];
  current_question_id?: string | null;
}

export interface ResponseEntry {
  id?: string;
  user_id: string;
  question_text: string;
  answer?: string;
  stage_number?: number;
  version: number;
  superseded: boolean;
  contradiction_flag: boolean;
  created_at?: string;
  updated_at?: string;
}

/* ------------------------------------------------------------------
    PROGRESS TABLE HELPERS
   ------------------------------------------------------------------ */

/**
 * Fetch a user's progress row by user_id.
 * Returns null if not found.
 */
export async function getProgress(userId: string): Promise<Progress | null> {
  if (!isValidUUID(userId)) {
    throw new Error("Invalid user ID format");
  }

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
  if (!isValidUUID(userId)) {
    throw new Error("Invalid user ID format");
  }

  const existing = await getProgress(userId);
  if (existing) {
    return existing;
  }

  const newProgress: Partial<Progress> = {
    user_id: userId,
    stage_number: 1,
    status: 'active',
    responses_count: 0,
    contradictions: false,
    completed_stages: []
  };

  const { data, error } = await supabase
    .from("progress")
    .insert([newProgress])
    .select()
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
  if (!isValidUUID(userId)) {
    throw new Error("Invalid user ID format");
  }

  const { data, error } = await supabase
    .from("progress")
    .update({
      ...updates,
      last_updated: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select()
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
    return await initProgress(userId);
  }

  const currentCount = progress.responses_count ?? 0;
  return updateProgress(userId, { responses_count: currentCount + 1 });
}

/**
 * Mark a stage as completed and update the user's current stage.
 */
export async function completeStage(userId: string, stageNumber: number): Promise<Progress> {
  const progress = await getProgress(userId);
  if (!progress) {
    throw new Error("User progress not found");
  }
  
  const completedStages = [...(progress.completed_stages || [])];
  if (!completedStages.includes(stageNumber)) {
    completedStages.push(stageNumber);
  }
  
  // Move to next stage if current stage was completed
  let nextStage = progress.stage_number;
  if (progress.stage_number === stageNumber) {
    nextStage = Math.min(stageNumber + 1, 6); // Kohlberg has 6 stages
  }
  
  return updateProgress(userId, { 
    completed_stages: completedStages,
    stage_number: nextStage
  });
}

/* ------------------------------------------------------------------
    RESPONSES TABLE HELPERS
   ------------------------------------------------------------------ */

/**
 * Saves a user's response to the "responses" table.
 */
export async function saveResponse(responseData: Partial<ResponseEntry>): Promise<ResponseEntry[]> {
  if (!responseData.user_id) {
    throw new Error("User ID is required");
  }
  
  if (!isValidUUID(responseData.user_id)) {
    throw new Error("Invalid user ID format");
  }

  const insertObj: Partial<ResponseEntry> = {
    ...responseData,
    version: responseData.version || 1,
    superseded: responseData.superseded || false,
    contradiction_flag: responseData.contradiction_flag || false,
  };

  const { data, error } = await supabase
    .from("responses")
    .insert([insertObj])
    .select();

  if (error) {
    console.error("Error saving response:", error);
    throw error;
  }

  await incrementResponseCount(responseData.user_id);
  return data || [];
}

/**
 * Fetch all responses (non-superseded by default) for a user.
 */
export async function getResponses(userId: string, includeSuperseded = false): Promise<ResponseEntry[]> {
  if (!isValidUUID(userId)) {
    throw new Error("Invalid user ID format");
  }

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

  return data || [];
}

/**
 * Fetch a single response by its primary key (id).
 */
export async function getResponseById(id: string): Promise<ResponseEntry | null> {
  if (!isValidUUID(id)) {
    throw new Error("Invalid response ID format");
  }

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
): Promise<ResponseEntry | null> {
  if (!isValidUUID(responseId)) {
    throw new Error("Invalid response ID format");
  }

  const { data, error } = await supabase
    .from("responses")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", responseId)
    .select()
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
export async function markContradiction(responseId: string, isContradictory = true): Promise<ResponseEntry | null> {
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

/**
 * Get responses for a specific stage
 */
export async function getResponsesByStage(userId: string, stageNumber: number): Promise<ResponseEntry[]> {
  if (!isValidUUID(userId)) {
    throw new Error("Invalid user ID format");
  }

  const { data, error } = await supabase
    .from("responses")
    .select("*")
    .eq("user_id", userId)
    .eq("stage_number", stageNumber)
    .eq("superseded", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching responses by stage:", error);
    throw error;
  }

  return data || [];
}

/**
 * Returns array of user answers that are not superseded,
 * sorted by creation time (ascending).
 */
export async function getNonSupersededAnswers(userId: string): Promise<Array<{ text: string, stage: number }>> {
  const { data, error } = await supabase
    .from("responses")
    .select("answer, stage_number")
    .eq("user_id", userId)
    .eq("superseded", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching user answers:", error);
    return [];
  }
  
  return data?.map(r => ({ 
    text: r.answer || "", 
    stage: r.stage_number || 1 
  })) || [];
}

/**
 * Fetches the user's current stage_number from "progress".
 * Returns null if not found or error encountered.
 */
export async function getUserStage(userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("progress")
    .select("stage_number")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.error("Error or no progress found for user stage:", error);
    return null;
  }
  return data.stage_number;
}

// Export the supabase client to be used elsewhere
export { supabase };