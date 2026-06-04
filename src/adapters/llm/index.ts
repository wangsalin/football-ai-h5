import { mockLlmProvider } from "@/adapters/llm/mockLlm";
import { openaiProvider } from "@/adapters/llm/openaiProvider";
import type { AiSettings } from "@/services/admin-settings";

export function getLlmProvider(settings?: AiSettings) {
  if (settings?.provider === "openai" || process.env.MOCK_LLM === "false") {
    return openaiProvider;
  }

  return mockLlmProvider;
}
