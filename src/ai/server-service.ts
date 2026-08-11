import "server-only";

import { AiDiagnosisService } from "@/ai/diagnosis-service";
import { OpenAiDiagnosisProvider } from "@/ai/openai-provider";
import { getAiRuntimeConfig, getOpenAiServerKey } from "@/ai/server-config";

let singleton: AiDiagnosisService | null = null;

export function getServerAiDiagnosisService() {
  if (singleton) return singleton;
  const config = getAiRuntimeConfig();
  const key = getOpenAiServerKey();
  const provider =
    config.availability === "ready" && key
      ? new OpenAiDiagnosisProvider(key, config.model)
      : null;
  singleton = new AiDiagnosisService(provider, {
    availability: config.availability,
    model: config.model,
    logger: (event) => {
      if (process.env.NODE_ENV !== "test") {
        console.info("TraceTutor AI event", event);
      }
    },
  });
  return singleton;
}
