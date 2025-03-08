import { supabase } from "@/lib/db";
import { saveResponse } from "@/lib/db"; // We'll call this to store the question
import { kohlbergStages } from "@/lib/constants"; // For examplePrompts, etc.

/** Adjust as needed for your local Ollama endpoint & model. */
const OLLAMA_URL = "http://127.0.0.1:11434";
const OLLAMA_MODEL = "deepseek-r1";

/* ------------------------------------------------------------------
   askLLM:
   The core utility that calls Ollama's /api/generate endpoint,
   removing <think>... blocks from the chain-of-thought.
------------------------------------------------------------------ */
export async function askLLM(prompt: string) {
  try {
    console.log(`🔍 Sending request to Ollama: ${OLLAMA_URL}/api/generate`);

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Ollama API Error: ${res.status} - ${errorText}`);
      throw new Error(`Ollama API request failed with status ${res.status}`);
    }

    const data = await res.json();
    let cleaned = data.response?.trim() || "";

    // Remove chain-of-thought <think> ... </think> if present
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");

    return cleaned.trim();
  } catch (error) {
    console.error("🚨 Error querying Ollama API:", error);
    throw error;
  }
}

/* ------------------------------------------------------------------
   getUserStage:
   Fetches the user's current stage_number from "progress".
   Returns null if not found or error encountered.
------------------------------------------------------------------ */
async function getUserStage(userId: string): Promise<number | null> {
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

/* ------------------------------------------------------------------
   getNonSupersededAnswers:
   Returns array of user answers that are not superseded,
   sorted by creation time (ascending).
------------------------------------------------------------------ */
async function getNonSupersededAnswers(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("responses")
    .select("answer")
    .eq("user_id", userId)
    .eq("superseded", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching user answers:", error);
    return [];
  }
  return data?.map((r) => r.answer) ?? [];
}

/* ------------------------------------------------------------------
   getStagePrompt:
   - Picks a baseline question from kohlbergStages[stageNumber].
   - By default, picks randomly. If you want a sequential approach,
     you can track how many questions in that stage they've already answered.
------------------------------------------------------------------ */
function getStagePrompt(stageNumber: number, random = true): string {
  const stageInfo = kohlbergStages.find((s) => s.stageNumber === stageNumber);
  if (!stageInfo || !stageInfo.examplePrompts?.length) {
    return "No predefined prompt available for this stage.";
  }

  if (random) {
    const idx = Math.floor(Math.random() * stageInfo.examplePrompts.length);
    return stageInfo.examplePrompts[idx];
  } else {
    return stageInfo.examplePrompts[0];
  }
}

/* ------------------------------------------------------------------
   generateNextQuestion:
   1) Get user’s stage.
   2) Pick a baseline question (from constants.ts).
   3) Gather prior user statements.
   4) LLM adapts that baseline question to the user’s history.
   5) Save the question to DB (with no answer yet).
   6) Return final question text.
------------------------------------------------------------------ */
export async function generateNextQuestion(userId: string) {
  // 1) Get the user's current stage
  const stageNumber = await getUserStage(userId);
  if (!stageNumber) {
    return "No stage found in progress. Please initialize the user's progress first.";
  }

  // 2) Baseline question from your constants
  const baselinePrompt = getStagePrompt(stageNumber, /*random=*/ true);

  // 3) Gather user’s prior statements
  const answers = await getNonSupersededAnswers(userId);
  const userHistory = answers
    .map((ans, idx) => `Statement ${idx + 1}: ${ans}`)
    .join("\n");

  // 4) LLM prompt to adapt the baseline question
  const adaptationPrompt = `
SYSTEM:
You are a moral philosophy AI. The user is at Kohlberg stage #${stageNumber}.

BASELINE QUESTION FOR THIS STAGE:
"${baselinePrompt}"

USER'S STATEMENTS:
${userHistory || "(No prior statements yet)"}

INSTRUCTION:
Adapt or rephrase the baseline question to reflect the user's conversation so far.
Keep it one sentence, open-ended, and aligned with stage #${stageNumber} logic.
Return ONLY the adapted question, no extra commentary.
`;

  // 5) Attempt to adapt the question using the LLM
  let finalQuestion: string;
  try {
    const adaptedQuestion = await askLLM(adaptationPrompt);
    finalQuestion = adaptedQuestion?.length ? adaptedQuestion : baselinePrompt;
  } catch (err) {
    console.error("🚨 Error adapting baseline question:", err);
    finalQuestion = baselinePrompt; // fallback if LLM fails
  }

  // 6) Save the question in the DB, with no answer yet
  //    (You can store 'stageNumber' if you want as well)
  await saveResponse({
    userId,
    questionText: finalQuestion,
    stageNumber,
    answer: "",  // no answer yet
  });

  // Return the final question text to your front end / route
  return finalQuestion;
}

/* ------------------------------------------------------------------
   checkForContradictions:
   Called after the user submits an answer. 
   The LLM checks if the new statement conflicts with prior ones.
------------------------------------------------------------------ */
export async function checkForContradictions(userId: string, newAnswer: string) {
  try {
    const answers = await getNonSupersededAnswers(userId);
    const statementsList = answers
      .map((ans, i) => `(${i + 1}) ${ans}`)
      .join("\n");

    const prompt = `
SYSTEM:
You are a contradiction-checking assistant.

PRIOR STATEMENTS:
${statementsList || "(No prior statements)"}

NEW STATEMENT:
"${newAnswer}"

INSTRUCTIONS:
1. Determine if this new statement logically or morally conflicts with any prior statements.
2. If a conflict exists, your final line must start with "YES" (then briefly say which statements conflict).
3. If no conflict, your final line must be just "NO".
4. Do not include extra lines after that final answer.
`;

    const response = await askLLM(prompt);
    if (!response) return { found: false };

    const lines = response.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const lastLine = lines[lines.length - 1].toUpperCase();

    if (lastLine.startsWith("YES")) {
      return { found: true, details: response };
    }
    return { found: false, details: response };
  } catch (err) {
    console.error("🚨 Error in checkForContradictions:", err);
    return { found: false };
  }
}

/* ------------------------------------------------------------------
   resolveContradictions:
   If there's a contradiction, the LLM generates a clarifying question
   to help the user reconcile the conflict.
------------------------------------------------------------------ */
export async function resolveContradictions(userId: string) {
  try {
    const stageNumber = await getUserStage(userId);
    if (!stageNumber) {
      return "No progress/stage found for user.";
    }

    const answers = await getNonSupersededAnswers(userId);
    const statementsList = answers
      .map((ans, i) => `(${i + 1}) ${ans}`)
      .join("\n");

    const resolutionPrompt = `
SYSTEM:
You are a moral philosophy AI. The user has indicated there's a contradiction at stage #${stageNumber}.
Here are their active statements:
${statementsList}

INSTRUCTION:
Ask a single open-ended question that helps the user reconcile their contradiction 
in the context of stage #${stageNumber}.
No extra commentary. Just one clarifying question.
`;

    const resolutionQuestion = await askLLM(resolutionPrompt);
    return resolutionQuestion || "Please clarify your stance to resolve the contradiction.";
  } catch (error) {
    console.error("🚨 Error in resolveContradictions:", error);
    return "Error generating a resolution prompt.";
  }
}

/* ------------------------------------------------------------------
   checkResolution:
   After the user provides an explanation or updated answer,
   see if the LLM deems the contradiction "RESOLVED" or not.
------------------------------------------------------------------ */
export async function checkResolution(userId: string, resolutionText: string): Promise<boolean> {
  try {
    const answers = await getNonSupersededAnswers(userId);
    const statementsList = answers
      .map((ans, i) => `(${i + 1}) ${ans}`)
      .join("\n");

    const prompt = `
SYSTEM:
The user had a contradiction among these statements:
${statementsList}

They now provide this resolution:
"${resolutionText}"

TASK:
1. If this explanation logically resolves the contradictions, final line must include "RESOLVED".
2. Otherwise, "NOT_RESOLVED".
3. No extra lines after that final answer.
`;

    const response = await askLLM(prompt);
    if (!response) return false;

    const lines = response.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const lastLine = lines[lines.length - 1].toUpperCase();

    return lastLine.includes("RESOLVED");
  } catch (error) {
    console.error("🚨 Error in checkResolution:", error);
    return false;
  }
}

/* ------------------------------------------------------------------
   generateFinalEvaluation:
   Once all 6 stages are complete and contradictions resolved,
   produce a final moral framework analysis from the LLM.
------------------------------------------------------------------ */
export async function generateFinalEvaluation(userId: string) {
  try {
    // Optionally, only fetch non-superseded answers if you want final ones.
    const { data, error } = await supabase
      .from("responses")
      .select("answer")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching for final evaluation:", error);
      return "Could not fetch user responses for final evaluation.";
    }

    const allAnswers = data?.map((r) => r.answer) || [];
    const joinedAnswers = allAnswers
      .map((ans, i) => `(${i + 1}) ${ans}`)
      .join("\n");

    const prompt = `
SYSTEM:
You are an AI specialized in Kohlberg's stages of moral development.
We have the user's entire conversation or final statements:

${joinedAnswers || "(No statements?)"}

INSTRUCTION:
Analyze these answers and produce a brief, educational summary of what moral framework 
the user primarily exhibits, referencing Kohlberg's stages if relevant.
Keep it concise and clear for a non-academic audience.
`;

    const response = await askLLM(prompt);
    return response || "Unable to generate a final evaluation.";
  } catch (err) {
    console.error("🚨 Error in generateFinalEvaluation:", err);
    return "Error generating final evaluation.";
  }
}
