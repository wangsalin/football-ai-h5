import { findSensitiveWords } from "@/lib/sensitive-words";
import type { AiAnalysisOutput } from "@/services/analysis/schema";

export function collectAnalysisText(output: AiAnalysisOutput) {
  return [
    output.summary,
    output.winDrawLossPick,
    output.handicapPick,
    output.totalGoalsPick,
    output.halfFullPick,
    output.coldAlertReason,
    ...output.scorePicks,
    ...output.sections.flatMap((section) => [section.title, section.content]),
  ]
    .filter(Boolean)
    .join("\n");
}

export function validateCompliantAnalysis(output: AiAnalysisOutput) {
  const words = findSensitiveWords(collectAnalysisText(output));

  if (words.length > 0) {
    return {
      ok: false as const,
      words,
    };
  }

  return {
    ok: true as const,
  };
}
