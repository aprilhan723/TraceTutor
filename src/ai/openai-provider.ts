import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { AiDiagnosisInput } from "@/domain/ai-diagnosis";
import type {
  AiDiagnosisProvider,
  AiProviderResult,
} from "@/ai/diagnosis-service";
import {
  buildAiDiagnosisPayload,
  AI_DIAGNOSIS_INSTRUCTIONS,
} from "@/ai/prompt";
import { aiDiagnosisSuggestionSchema } from "@/ai/schemas";

export class OpenAiDiagnosisProvider implements AiDiagnosisProvider {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new OpenAI({ apiKey, maxRetries: 0, timeout: 8_000 });
  }

  async suggest(
    input: AiDiagnosisInput,
    options: { signal: AbortSignal; safetyIdentifier: string },
  ): Promise<AiProviderResult> {
    const response = await this.client.responses.parse(
      {
        model: this.model,
        store: false,
        safety_identifier: options.safetyIdentifier,
        instructions: AI_DIAGNOSIS_INSTRUCTIONS,
        input: buildAiDiagnosisPayload(input),
        max_output_tokens: 900,
        text: {
          format: zodTextFormat(
            aiDiagnosisSuggestionSchema,
            "tracetutor_diagnosis_suggestion",
          ),
        },
      },
      { signal: options.signal },
    );
    const usage = response.usage ?? {
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
    };
    return {
      output: response.output_parsed,
      modelVersion: response.model,
      usage: {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        totalTokens: usage.total_tokens,
      },
    };
  }
}
