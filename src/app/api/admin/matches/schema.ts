import { z } from "zod";

export const matchWriteSchema = z
  .object({
    competitionName: z.string().trim().min(1, "请输入联赛"),
    homeTeamName: z.string().trim().min(1, "请输入主队"),
    awayTeamName: z.string().trim().min(1, "请输入客队"),
    kickoffAt: z.string().datetime("请输入有效开赛时间"),
    status: z.enum(["SCHEDULED", "LIVE", "FINISHED", "CANCELLED"]),
    venue: z.string().trim().optional(),
    homeScore: z.number().int().min(0).nullable().optional(),
    awayScore: z.number().int().min(0).nullable().optional(),
    source: z.enum(["manual", "china_sports_lottery"]).optional().default("manual"),
  })
  .refine((data) => data.homeTeamName !== data.awayTeamName, {
    message: "主队和客队不能相同",
    path: ["awayTeamName"],
  });

export function toMatchWriteInput(data: z.infer<typeof matchWriteSchema>) {
  return {
    ...data,
    kickoffAt: new Date(data.kickoffAt),
    venue: data.venue || undefined,
    homeScore: data.homeScore ?? null,
    awayScore: data.awayScore ?? null,
  };
}
