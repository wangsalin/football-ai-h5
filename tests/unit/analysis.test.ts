import { describe, expect, it } from "vitest";
import { aiAnalysisOutputSchema, aiAnalysisSectionKeys } from "@/services/analysis/schema";
import { validateCompliantAnalysis } from "@/services/analysis/guardrails";

const sectionTitles: Record<(typeof aiAnalysisSectionKeys)[number], string> = {
  overview: "赛事背景",
  strength: "实力定位",
  form: "近期状态",
  motivation: "战意动机",
  schedule: "赛程体能",
  lineup: "伤停阵容",
  tactics: "战术对位",
  homeAway: "主客场因素",
  h2h: "历史交锋",
  odds: "赔率指数",
  tempo: "节奏比分",
  risk: "风险提示",
};

const validDraft = {
  summary: "主队方向更完整，但仍需防平。",
  winDrawLossPick: "胜/平",
  handicapPick: "让平/让负",
  scorePicks: ["1-0", "1-1", "2-1"],
  totalGoalsPick: "2/3球",
  halfFullPick: "平胜/平平",
  riskLevel: "MEDIUM",
  confidence: 6.6,
  coldAlertReason: "市场热度变化较快。",
  sections: aiAnalysisSectionKeys.map((sectionKey) => ({
    sectionKey,
    title: sectionTitles[sectionKey],
    content: `${sectionTitles[sectionKey]}需要结合可核验数据交叉判断，信息不足时降低信心。`,
  })),
};

describe("analysis schema", () => {
  it("accepts a compliant AI draft", () => {
    expect(aiAnalysisOutputSchema.safeParse(validDraft).success).toBe(true);
  });

  it("rejects drafts without exactly three score picks", () => {
    expect(aiAnalysisOutputSchema.safeParse({ ...validDraft, scorePicks: ["1-0"] }).success).toBe(false);
  });

  it("detects sensitive wording before save", () => {
    const parsed = aiAnalysisOutputSchema.parse({
      ...validDraft,
      summary: "主队方向更完整，但不承诺保证命中。",
    });

    expect(validateCompliantAnalysis(parsed)).toEqual({
      ok: false,
      words: ["保证命中"],
    });
  });
});
