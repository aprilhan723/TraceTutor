import "server-only";

import { AI_DIAGNOSIS_PROMPT_VERSION } from "@/domain/ai-diagnosis";

export const DEFAULT_OPENAI_DIAGNOSIS_MODEL = "gpt-5.6-luna";

export interface AiRuntimeConfig {
  availability: "ready" | "disabled" | "missing-key";
  model: string;
  promptVersion: typeof AI_DIAGNOSIS_PROMPT_VERSION;
}

export function getAiRuntimeConfig(): AiRuntimeConfig {
  const enabled = process.env.TRACETUTOR_LIVE_AI_ENABLED === "true";
  const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  return {
    availability: !enabled ? "disabled" : hasKey ? "ready" : "missing-key",
    model:
      process.env.TRACETUTOR_OPENAI_MODEL?.trim() ||
      DEFAULT_OPENAI_DIAGNOSIS_MODEL,
    promptVersion: AI_DIAGNOSIS_PROMPT_VERSION,
  };
}

export function getOpenAiServerKey() {
  return process.env.OPENAI_API_KEY?.trim() || null;
}
