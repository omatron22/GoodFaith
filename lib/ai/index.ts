// lib/ai/index.ts
import { saveResponse, getUserStage, getNonSupersededAnswers, getProgress } from "@/lib/db";
import { kohlbergStages } from "@/lib/constants";

/** Get Ollama environment variables with fallbacks */
const OLLAMA_URL = process.env.NEXT_PUBLIC_OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.NEXT_PUBLIC_OLLAMA_MODEL || "deepseek-r1";

/**
 * Core utility that calls Ollama's /api/generate endpoint,
 * removing <think>... blocks from the chain-of-thought.
 */
export async function askLLM(prompt: string, temperature = 0.7) {
  try {
    console.log(`🔍 Sending request to Ollama: ${OLLAMA_URL}/api/generate`);

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        temperature
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

/**
 * Picks a baseline question from kohlbergStages[stageNumber].
 */
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

/**
 * Generate and save the next question for the user based on their stage and history.
 */
export async function generateNextQuestion(userId: string) {
  // Get the user's current stage
  const stageNumber = await getUserStage(userId);
  if (!stageNumber) {
    throw new Error("No stage found in progress. Please initialize the user's progress first.");
  }

  // Baseline question from constants
  const baselinePrompt = getStagePrompt(stageNumber, /*random=*/ true);

  // Gather user's prior statements
  const previousAnswers = await getNonSupersededAnswers(userId);
  
  const userHistory = previousAnswers
    .map((ans, idx) => `[Stage ${ans.stage}] Statement ${idx + 1}: ${ans.text}`)
    .join("\n");

  // Stage description for context
  const stageInfo = kohlbergStages.find(s => s.stageNumber === stageNumber);
  const stageDescription = stageInfo?.shortDescription || "";

  // Enhanced LLM prompt to adapt the baseline question
  const adaptationPrompt = `
SYSTEM:
You are a moral philosophy AI specializing in Lawrence Kohlberg's stages of moral development.
The user is currently at Stage ${stageNumber}: ${stageInfo?.name}.

STAGE DESCRIPTION:
${stageDescription}

BASELINE QUESTION FOR THIS STAGE:
"${baselinePrompt}"

USER'S PREVIOUS STATEMENTS:
${userHistory || "(No prior statements yet)"}

INSTRUCTION:
Create a thoughtful, open-ended moral dilemma or question aligned with Stage ${stageNumber} thinking.
The question should:
1. Be appropriately challenging for the user's current moral development stage
2. Build on themes or principles from their prior responses when possible
3. Introduce new moral concepts appropriate for Stage ${stageNumber}
4. Encourage deeper reflection than previous questions
5. Avoid being too abstract or philosophical for lower stages (1-2)
6. For higher stages (5-6), explore universal principles and ethical reasoning

<think>
- For Stage 1-2 (Preconventional): Focus on consequences, self-interest, and concrete scenarios
- For Stage 3-4 (Conventional): Emphasize social norms, relationships, rules, and authority
- For Stage 5-6 (Postconventional): Explore social contracts, rights, justice, and universal principles
- Analyze their previous responses for:
  * Depth of moral reasoning
  * Consistency of principles
  * Areas that could benefit from further exploration
  * Potential blind spots in their moral framework
- If this is a new stage, introduce foundational concepts for that stage
- If they're progressing within a stage, increase complexity gradually
</think>

Return ONLY the adapted question with no extra text or explanation.
Aim for a question that is clear, concise (1-3 sentences), thought-provoking, and tailored to their demonstrated moral reasoning level.
`;

  // Attempt to adapt the question using the LLM
  let finalQuestion: string;
  let responseId: string | undefined;
  
  try {
    const adaptedQuestion = await askLLM(adaptationPrompt, 0.75);
    finalQuestion = adaptedQuestion?.length ? adaptedQuestion : baselinePrompt;
    
    // Save the question in the DB
    const savedResponse = await saveResponse({
      user_id: userId,
      question_text: finalQuestion,
      stage_number: stageNumber,
      answer: "",  // no answer yet
      version: 1,
      superseded: false,
      contradiction_flag: false
    });
    
    if (savedResponse && savedResponse[0]) {
      responseId = savedResponse[0].id;
    }
    
  } catch (err) {
    console.error("🚨 Error adapting baseline question:", err);
    finalQuestion = baselinePrompt; // fallback if LLM fails
    
    // Still save the fallback question
    const savedResponse = await saveResponse({
      user_id: userId,
      question_text: finalQuestion,
      stage_number: stageNumber,
      answer: "",
      version: 1,
      superseded: false,
      contradiction_flag: false
    });
    
    if (savedResponse && savedResponse[0]) {
      responseId = savedResponse[0].id;
    }
  }

  // Return the final question text and responseId
  return { question: finalQuestion, responseId };
}

/**
 * Called after the user submits an answer. 
 * The LLM checks if the new statement conflicts with prior ones.
 */
export async function checkForContradictions(userId: string, newAnswer: string) {
  try {
    const previousAnswers = await getNonSupersededAnswers(userId);
    
    // If there are no previous answers or only one, there can't be contradictions
    if (previousAnswers.length <= 1) {
      return { found: false, details: null };
    }
    
    const statementsList = previousAnswers
      .map((ans, i) => `[Stage ${ans.stage}] Statement ${i + 1}: ${ans.text}`)
      .join("\n");

    const prompt = `
SYSTEM:
You are a contradiction-detection assistant specializing in moral reasoning analysis.
Your task is to carefully evaluate if a new statement contradicts previous moral statements.

PRIOR STATEMENTS:
${statementsList}

NEW STATEMENT:
"${newAnswer}"

INSTRUCTIONS:
1. Analyze the logical and moral consistency between the new statement and prior statements.
2. Look beyond surface-level wording differences to identify true contradictions in moral reasoning.
3. A contradiction occurs when two statements cannot both be true at the same time within the same moral framework.
4. Minor inconsistencies or different emphasis does NOT constitute a contradiction.

<think>
- First, identify the key moral principles or reasoning in each statement
- Compare the principles across statements, not just specific examples or contexts
- Consider if apparent contradictions might be explained by:
  * Different contexts for different statements
  * Evolution of thinking (which is not a contradiction)
  * Different aspects of a complex moral view
- Only flag clear, irreconcilable conflicts in stated moral principles
</think>

CONCLUSION:
1. If you find a DEFINITE contradiction, respond with: "CONTRADICTION: [explain the specific contradiction]"
2. If there is NO contradiction, respond with: "NO_CONTRADICTION"
`;

    const response = await askLLM(prompt, 0.2); // Lower temperature for more consistent evaluation
    if (!response) return { found: false, details: null };

    // FIX: More precise check for the contradiction pattern
    // Check specifically for the word "CONTRADICTION:" at the beginning of the response
    const hasContradiction = response.toUpperCase().startsWith("CONTRADICTION:");
    
    if (hasContradiction) {
      // Extract just the explanation part if there's a contradiction
      const explanation = response.replace(/^CONTRADICTION:\s*/i, "").trim();
      return { found: true, details: explanation };
    }
    
    return { found: false, details: null };
  } catch (err) {
    console.error("🚨 Error in checkForContradictions:", err);
    return { found: false, details: null };
  }
}

/**
 * If there's a contradiction, the LLM generates a clarifying question
 * to help the user reconcile the conflict.
 */
export async function resolveContradictions(userId: string) {
  try {
    const stageNumber = await getUserStage(userId);
    if (!stageNumber) {
      return "No progress/stage found for user.";
    }

    const answers = await getNonSupersededAnswers(userId);
    const statementsList = answers
      .map((ans, i) => `[Stage ${ans.stage}] Statement ${i + 1}: ${ans.text}`)
      .join("\n");

    const resolutionPrompt = `
SYSTEM:
You are a moral philosophy AI facilitator. The user has made statements that appear to contain contradictions.
Your goal is to help them examine and clarify their moral reasoning.

USER'S STATEMENTS:
${statementsList}

INSTRUCTION:
Craft a single focused, non-judgmental question that will help the user:
1. Recognize the contradiction in their statements
2. Reflect on their true position
3. Reconcile or clarify their moral reasoning

<think>
- Identify the specific statements that seem to conflict
- Frame your question to highlight the tension without making the user defensive
- Use neutral language that invites reflection rather than forcing agreement with one view
- Focus on understanding their reasoning process, not just which position they "really" hold
</think>

Your question should be open-ended, respectful, and genuinely curious about their moral framework.
Return ONLY the question without preamble or explanation.
`;

    const resolutionQuestion = await askLLM(resolutionPrompt, 0.7);
    return resolutionQuestion || "Could you explain how these different moral views fit together in your thinking?";
  } catch (error) {
    console.error("🚨 Error in resolveContradictions:", error);
    return "Could you clarify your thinking about these seemingly different moral positions?";
  }
}

/**
 * After the user provides an explanation or updated answer,
 * see if the LLM deems the contradiction "RESOLVED" or not.
 */
export async function checkResolution(userId: string, resolutionText: string): Promise<boolean> {
  try {
    const answers = await getNonSupersededAnswers(userId);
    const statementsList = answers
      .map((ans, i) => `[Stage ${ans.stage}] Statement ${i + 1}: ${ans.text}`)
      .join("\n");

    const prompt = `
SYSTEM:
You are an AI specializing in moral reasoning analysis. The user previously made statements with apparent contradictions.
They've now provided an explanation attempting to resolve these contradictions.

USER'S STATEMENTS:
${statementsList}

USER'S RESOLUTION ATTEMPT:
"${resolutionText}"

INSTRUCTIONS:
Evaluate whether the user's explanation successfully resolves the contradictions in their statements.
A successful resolution should:
1. Acknowledge the tension between their earlier statements
2. Provide a coherent framework that reconciles the apparently conflicting views
3. Demonstrate a consistent moral reasoning process

<think>
- Does the resolution address the core contradiction?
- Is the explanation logically coherent?
- Has the user refined their position in a way that maintains integrity?
- Remember that people can hold nuanced views that may appear contradictory on the surface
</think>

CONCLUSION:
1. If the contradictions are RESOLVED, respond with: "RESOLVED"
2. If the contradictions remain UNRESOLVED, respond with: "UNRESOLVED"
`;

    const response = await askLLM(prompt, 0.3);
    if (!response) return false;

    return response.toUpperCase().includes("RESOLVED");
  } catch (error) {
    console.error("🚨 Error in checkResolution:", error);
    return false;
  }
}

/**
 * Once all stages are complete or upon user request,
 * produce a final moral framework analysis from the LLM.
 */
export async function generateFinalEvaluation(userId: string) {
  try {
    // Get all non-superseded answers with their stage numbers
    const previousAnswers = await getNonSupersededAnswers(userId);
    
    // Get user progress to understand which stages they've completed
    const progress = await getProgress(userId);
    const completedStages = progress?.completed_stages || [];
    
    const userStatements = previousAnswers
      .map((ans, i) => `[Stage ${ans.stage}] Response ${i + 1}: ${ans.text}`)
      .join("\n\n");

    const prompt = `
SYSTEM:
You are an AI expert in moral philosophy and Kohlberg's stages of moral development.
Analyze the user's moral reasoning based on their responses to various moral questions.

USER'S RESPONSES:
${userStatements || "(No responses recorded)"}

STAGES COMPLETED: ${completedStages.join(", ") || "None"}

INSTRUCTIONS:
Create a thoughtful, educational analysis of the user's moral reasoning framework.
Your analysis should:

1. Identify patterns in their moral reasoning approach
2. Connect their responses to Kohlberg's stages where appropriate
3. Note any evolution or consistency in their thinking
4. Highlight strengths in their moral reasoning
5. Suggest areas for further reflection (without being judgmental)
6. Provide personalized insights about their moral framework

<think>
- Look for evidence of which stage(s) their reasoning most closely resembles
- Note if different responses show different stages of reasoning (moral pluralism)
- Consider both the explicit content and implicit values in their answers
- Look for recurring themes, principles, or concerns in their responses
- Note if they show more sophisticated reasoning in certain domains vs others
- Consider their moral "blind spots" or areas they haven't explored
- Avoid making simplified judgments about which stage is "better"
- Remember that moral reasoning is complex and may not fit neatly into one stage
</think>

Format your response in these clear sections:
1. Summary of Moral Reasoning Style (1-2 paragraphs)
2. Connection to Kohlberg's Framework (1-2 paragraphs)
3. Key Themes & Principles (3-4 bullet points highlighting their core values)
4. Strengths Observed (3-4 bullet points)
5. Areas for Growth (2-3 bullet points, phrased constructively)
6. Questions for Further Reflection (3 thoughtful questions)

Keep your analysis respectful, nuanced, and educational rather than evaluative.
Emphasize that this is a snapshot of their current thinking, not a permanent assessment.
`;

    const analysis = await askLLM(prompt, 0.7);
    return analysis || "Unable to generate a final evaluation with the current responses.";
  } catch (err) {
    console.error("🚨 Error in generateFinalEvaluation:", err);
    return "Error generating final evaluation. Please try again later.";
  }
}

/**
 * Generate a custom question based on a specific moral dilemma or scenario.
 * This allows for more flexible questioning beyond the stage-based approach.
 */
export async function generateCustomQuestion(userId: string, theme: string) {
  try {
    const stageNumber = await getUserStage(userId);
    if (!stageNumber) {
      throw new Error("No stage found for user.");
    }
    
    const prompt = `
SYSTEM:
You are a moral philosophy AI specializing in creating thought-provoking ethical questions.
The user is at Stage ${stageNumber} of Kohlberg's moral development.

THEME REQUESTED:
"${theme}"

INSTRUCTION:
Create an engaging, open-ended moral question related to the requested theme.
The question should:
1. Be appropriate for someone at Stage ${stageNumber} of moral reasoning
2. Encourage reflection on values and principles
3. Be concise (1-2 sentences maximum)
4. Avoid political polarization or extremely controversial current events
5. Be accessible without specialized knowledge

<think>
- Consider what aspects of this theme would be most relevant to their current stage
- For lower stages (1-2), focus on personal consequences and fairness
- For middle stages (3-4), emphasize social norms and responsibilities
- For higher stages (5-6), explore universal principles and complex ethical trade-offs
</think>

Return ONLY the question without explanation or commentary.
`;

    const question = await askLLM(prompt, 0.8);
    if (!question) {
      throw new Error("Failed to generate custom question");
    }
    
    // Save the custom question
    const savedResponse = await saveResponse({
      user_id: userId,
      question_text: question,
      stage_number: stageNumber,
      answer: "",
      version: 1,
      superseded: false,
      contradiction_flag: false
    });
    
    let responseId;
    if (savedResponse && savedResponse[0]) {
      responseId = savedResponse[0].id;
    }
    
    return { question, responseId };
  } catch (err) {
    console.error("🚨 Error generating custom question:", err);
    throw err;
  }
}