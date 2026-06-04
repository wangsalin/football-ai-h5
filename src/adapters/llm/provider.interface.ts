import type { AiAnalysisInput, AiAnalysisOutput } from "@/services/analysis/schema";
import type { AiSettings } from "@/services/admin-settings";

export type AiReviewInput = {
  matchTitle: string;
  kickoffAt: string;
  actualResult: string;
  predictedSummary?: string;
  scorePicks?: string[];
};

export type AiReviewOutput = {
  resultType: "HIT" | "MISS" | "PARTIAL";
  hitSummary: string;
  missReason?: string;
  correctionNote?: string;
};

export interface LlmProvider {
  generatePredictionDraft(input: AiAnalysisInput, settings?: AiSettings): Promise<AiAnalysisOutput>;
  generateReviewDraft?(input: AiReviewInput, settings?: AiSettings): Promise<AiReviewOutput>;
}
