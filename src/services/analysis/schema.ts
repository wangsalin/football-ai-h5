import { z } from "zod";

export const aiAnalysisSectionKeys = [
  "overview",
  "strength",
  "form",
  "motivation",
  "schedule",
  "lineup",
  "tactics",
  "homeAway",
  "h2h",
  "odds",
  "tempo",
  "risk",
] as const;

export const aiAnalysisInputSchema = z.object({
  match: z.object({
    competition: z.string().min(1),
    kickoffAt: z.string().min(1),
    homeTeam: z.string().min(1),
    awayTeam: z.string().min(1),
    venue: z.string().optional(),
  }),
  basic: z.object({
    homeRank: z.number().optional(),
    awayRank: z.number().optional(),
    homeRecentForm: z.string().optional(),
    awayRecentForm: z.string().optional(),
    motivationSummary: z.string().optional(),
  }),
  lineup: z.object({
    homeInjuries: z.array(z.string()).default([]),
    awayInjuries: z.array(z.string()).default([]),
    scheduleImpact: z.string().optional(),
  }),
  odds: z.object({
    europeanInitial: z.object({
      home: z.number(),
      draw: z.number(),
      away: z.number(),
    }),
    europeanCurrent: z.object({
      home: z.number(),
      draw: z.number(),
      away: z.number(),
    }),
    asianInitial: z.string(),
    asianCurrent: z.string(),
    goalLineInitial: z.string(),
    goalLineCurrent: z.string(),
    source: z.string().optional(),
    capturedAt: z.string().optional(),
  }),
});

export const aiAnalysisOutputSchema = z.object({
  summary: z.string().min(1).max(120),
  winDrawLossPick: z.string().min(1),
  handicapPick: z.string().optional(),
  scorePicks: z.array(z.string()).length(3),
  totalGoalsPick: z.string().optional(),
  halfFullPick: z.string().optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  confidence: z.number().min(1).max(8.5),
  coldAlertReason: z.string().optional(),
  sections: z
    .array(
      z.object({
        sectionKey: z.enum(aiAnalysisSectionKeys),
        title: z.string().min(1),
        content: z.string().min(1),
      }),
    )
    .length(aiAnalysisSectionKeys.length),
});

export type AiAnalysisInput = z.infer<typeof aiAnalysisInputSchema>;
export type AiAnalysisOutput = z.infer<typeof aiAnalysisOutputSchema>;
