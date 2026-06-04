import { z } from "zod";

export const reviewWriteSchema = z.object({
  matchId: z.string().min(1, "请选择赛事"),
  predictionId: z.string().trim().optional(),
  actualResult: z.string().trim().min(1, "请填写赛果"),
  resultType: z.enum(["HIT", "MISS", "PARTIAL"]),
  hitSummary: z.string().trim().min(6, "请填写复盘摘要"),
  missReason: z.string().trim().optional(),
  correctionNote: z.string().trim().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "OFFLINE"]),
});

export function toReviewWriteInput(data: z.infer<typeof reviewWriteSchema>) {
  return {
    ...data,
    predictionId: data.predictionId || undefined,
    missReason: data.missReason || undefined,
    correctionNote: data.correctionNote || undefined,
  };
}
