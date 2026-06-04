import { z } from "zod";
import { aiAnalysisSectionKeys } from "@/services/analysis/schema";

export const predictionWriteSchema = z.object({
  matchId: z.string().min(1, "请选择赛事"),
  summary: z.string().trim().min(6, "请填写预测摘要"),
  winDrawLossPick: z.string().trim().min(1, "请填写胜平负方向"),
  handicapPick: z.string().trim().optional(),
  scorePicks: z.array(z.string().trim().min(1)).min(1, "请至少填写一个比分"),
  totalGoalsPick: z.string().trim().optional(),
  halfFullPick: z.string().trim().optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  confidence: z.number().min(0).max(10),
  coldAlertReason: z.string().trim().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "OFFLINE"]),
  sections: z
    .array(
      z.object({
        sectionKey: z.enum(aiAnalysisSectionKeys),
        title: z.string().trim().min(1),
        content: z.string().trim().min(1),
      }),
    )
    .optional(),
});

export function toPredictionWriteInput(data: z.infer<typeof predictionWriteSchema>) {
  return {
    ...data,
    handicapPick: data.handicapPick || undefined,
    totalGoalsPick: data.totalGoalsPick || undefined,
    halfFullPick: data.halfFullPick || undefined,
    coldAlertReason: data.coldAlertReason || undefined,
  };
}
