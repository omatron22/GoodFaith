import { supabase } from "@/lib/db";

const OLLAMA_URL = "http://127.0.0.1:11434"; // Adjust if needed

/**
 * Sends a request to Ollama to generate a response, 
 * then removes any <think> ... </think> blocks from the final text.
 */
export async function askLLM(prompt: string) {
  try {
    console.log(`🔍 Sending request to Ollama: ${OLLAMA_URL}/api/generate`);

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-r1",
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

    // 1) Trim overall response
    let cleaned = data.response?.trim() || "";

    // 2) Remove chain-of-thought or introspection blocks <think> ... </think>
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");

    // 3) Final trim
    return cleaned.trim();
  } catch (error) {
    console.error("🚨 Error querying Ollama API:", error);
    throw error;
  }
}

/**
 * Generates a single open-ended follow-up question for the user's current root.
 */
export async function generateNextQuestion(userId: string, currentRoot: string) {
  try {
    const { data: responses, error: fetchError } = await supabase
      .from("responses")
      .select("question_id, answer")
      .eq("user_id", userId);

    if (fetchError) throw fetchError;

    const userHistory = responses
      .map((r, idx) => `Statement ${idx + 1}: ${r.answer}`)
      .join("\n");

    // Define complexity based on total answers
    const numResponses = responses.length;
    let complexityLevel = "basic";
    if (numResponses >= 2) complexityLevel = "intermediate";
    if (numResponses >= 4) complexityLevel = "advanced";

    const prompt = `
SYSTEM:
You are a helpful moral philosophy AI. You create a SINGLE open-ended question
based on the user's current root: "${currentRoot}".

USER RESPONSES HISTORY:
${userHistory}

INSTRUCTION:
Generate a **${complexityLevel}** follow-up question that pushes their reasoning further.
Keep it short, direct, and open-ended (one sentence). Nothing else.
`;

    const rawAnswer = await askLLM(prompt);
    return rawAnswer || "Could not generate a valid question.";
  } catch (error) {
    console.error("🚨 Error generating follow-up question:", error);
    throw error;
  }
}

/**
 * Checks if the user's new statement contradicts any prior statements.
 * We instruct the LLM to return "YES" (plus explanation) or "NO" on the last line.
 */
export async function checkForContradictions(userId: string, newAnswer: string) {
  try {
    // 1) Fetch all user responses
    const { data: allResponses, error: fetchErr } = await supabase
      .from("responses")
      .select("answer")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (fetchErr) {
      console.error("Error fetching prior responses:", fetchErr);
      return { found: false };
    }

    // Build a list of prior statements
    const statementsList = (allResponses ?? [])
      .map((resp, i) => `(${i + 1}) ${resp.answer}`)
      .join("\n");

    // 2) Prompt that MUST end with "YES" or "NO" on its final line
    // If "YES", it can also include a short explanation in the same line.
    const prompt = `
SYSTEM:
You are a contradiction-checking assistant. 
We have these prior statements from the user:
${statementsList}

NEW STATEMENT:
"${newAnswer}"

INSTRUCTION:
1. Determine if this new statement logically or morally conflicts with any prior statements.
2. If a conflict exists, your final line must start with "YES" (then you can briefly say which statements conflict).
3. If no conflict, your final line must be just "NO".
4. Do not include any extra lines after that final answer.
`;

    const response = await askLLM(prompt);
    if (!response) return { found: false };

    // 3) We'll parse the last line for "YES" or "NO"
    const lines = response.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const lastLine = lines[lines.length - 1].toUpperCase();

    if (lastLine.startsWith("YES")) {
      // Contradiction found
      return { found: true, details: response };
    } else {
      // We assume "NO" or something else means no contradiction
      return { found: false, details: response };
    }
  } catch (err) {
    console.error("🚨 Error in checkForContradictions:", err);
    // Fallback: no contradiction
    return { found: false };
  }
}

/**
 * Once a contradiction is flagged, we generate a resolution question to the user.
 */
export async function resolveContradictions(userId: string) {
  try {
    // 1) We already know contradictions=true, fetch the user's root for context
    const { data: progress, error: progressError } = await supabase
      .from("progress")
      .select("root")
      .eq("user_id", userId)
      .maybeSingle();

    if (progressError) throw progressError;
    if (!progress) return "No progress found";

    const { root } = progress;

    // 2) Summarize the user's statements for the prompt
    const { data: allResponses } = await supabase
      .from("responses")
      .select("answer")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    const statementsList = (allResponses ?? [])
      .map((resp, i) => `(${i + 1}) ${resp.answer}`)
      .join("\n");

    // 3) Ask the LLM to produce a single clarifying question
    const resolutionPrompt = `
SYSTEM:
You are a moral philosophy AI. The user has contradictions in the topic "${root}".
Here are their statements so far:
${statementsList}

INSTRUCTION:
Ask a single clarifying question that helps the user reconcile or resolve their contradiction.
One open-ended question, no extra commentary.
`;

    const resolutionQuestion = await askLLM(resolutionPrompt);
    return resolutionQuestion || "Please clarify your stance to resolve the contradiction.";
  } catch (error) {
    console.error("🚨 Error resolving contradictions:", error);
    return "Error generating a resolution prompt.";
  }
}

/**
 * Check the user's resolution text to see if it resolves the contradiction.
 * Return true if the final line includes "RESOLVED", false otherwise.
 */
export async function checkResolution(userId: string, resolutionText: string): Promise<boolean> {
  try {
    // 1) Gather all prior statements for context
    const { data: allResponses } = await supabase
      .from("responses")
      .select("answer")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    const statementsList = (allResponses ?? [])
      .map((resp, i) => `(${i + 1}) ${resp.answer}`)
      .join("\n");

    // 2) LLM Prompt
    const prompt = `
SYSTEM:
The user had a contradiction among these statements:
${statementsList}

They now provide this resolution:
"${resolutionText}"

TASK:
1. If this explanation logically resolves the contradictions, your final line must include the word "RESOLVED".
2. Otherwise, end with "NOT_RESOLVED".
3. No extra lines after that final answer.
`;

    const response = await askLLM(prompt);
    if (!response) return false;

    // 3) Check the last line for "RESOLVED"
    const lines = response.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const lastLine = lines[lines.length - 1].toUpperCase();

    if (lastLine.includes("RESOLVED")) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("🚨 Error checking resolution:", error);
    return false;
  }
}
