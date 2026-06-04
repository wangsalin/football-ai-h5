import type { LlmProvider } from "@/adapters/llm/provider.interface";

export const mockLlmProvider: LlmProvider = {
  async generatePredictionDraft(input) {
    const homeDirection = input.odds.europeanCurrent.home <= input.odds.europeanInitial.home;
    const riskLevel = homeDirection ? "MEDIUM" : "HIGH";

    return {
      summary: homeDirection
        ? "主队基本面和数据方向更完整，但市场热度上升后仍需防平。"
        : "主队方向支持不足，客队反击和节奏变化会放大不确定性。",
      winDrawLossPick: homeDirection ? "胜/平" : "平/负",
      handicapPick: homeDirection ? "让平/让负" : "让负",
      scorePicks: homeDirection ? ["1-0", "1-1", "2-1"] : ["0-0", "1-1", "1-2"],
      totalGoalsPick: input.odds.goalLineCurrent.includes("2.25") ? "1/2球" : "2/3球",
      halfFullPick: homeDirection ? "平胜/平平" : "平平/平负",
      riskLevel,
      confidence: homeDirection ? 6.6 : 5.7,
      coldAlertReason: "盘口和热度变化较快，如临场阵容出现调整，需要降低结论强度。",
      sections: [
        {
          sectionKey: "overview",
          title: "赛事背景",
          content: input.basic.motivationSummary || "双方基本面信息有限，不能作为强结论。",
        },
        {
          sectionKey: "strength",
          title: "实力定位",
          content: "当前输入缺少完整排名和阵容身价，只能结合联赛定位与赔率区间做谨慎判断。",
        },
        {
          sectionKey: "form",
          title: "近期状态",
          content: `${input.match.homeTeam}近况：${input.basic.homeRecentForm || "未提供"}；${input.match.awayTeam}近况：${input.basic.awayRecentForm || "未提供"}，状态数据不足会降低信心。`,
        },
        {
          sectionKey: "motivation",
          title: "战意动机",
          content: input.basic.motivationSummary || "战意信息未能核验，需要结合积分形势和赛前发布会再确认。",
        },
        {
          sectionKey: "schedule",
          title: "赛程体能",
          content: input.lineup.scheduleImpact || "自动任务未接入完整赛程密度数据，体能影响需要临场补充。",
        },
        {
          sectionKey: "lineup",
          title: "阵容面",
          content: `主队伤停：${input.lineup.homeInjuries.join("、") || "暂无明确核心伤停"}；客队伤停：${input.lineup.awayInjuries.join("、") || "暂无明确核心伤停"}。`,
        },
        {
          sectionKey: "tactics",
          title: "战术对位",
          content: "预计主队更重视阵地推进，客队会寻找转换机会，边路回防和定位球保护是主要观察点。",
        },
        {
          sectionKey: "homeAway",
          title: "主客场因素",
          content: `比赛场地为${input.match.venue || "未提供"}，主客场优势需要结合旅行距离、气候适应和主场表现进一步核验。`,
        },
        {
          sectionKey: "h2h",
          title: "历史交锋",
          content: "历史交锋数据未在输入中提供，只能作为低权重参考，不能单独支撑赛前方向。",
        },
        {
          sectionKey: "odds",
          title: "数据面",
          content: `欧赔从 ${input.odds.europeanInitial.home}/${input.odds.europeanInitial.draw}/${input.odds.europeanInitial.away} 变化到 ${input.odds.europeanCurrent.home}/${input.odds.europeanCurrent.draw}/${input.odds.europeanCurrent.away}，需要结合临场热度判断。`,
        },
        {
          sectionKey: "tempo",
          title: "比赛节奏",
          content: "预计开局阶段较谨慎，中后段会根据比分变化出现更多转换空间。",
        },
        {
          sectionKey: "risk",
          title: "风险提示",
          content: "信息不足时不做强结论，最终内容仅供数据分析参考，不构成投注建议。",
        },
      ],
    };
  },
  async generateReviewDraft(input) {
    const hit = input.scorePicks?.includes(input.actualResult);

    return {
      resultType: hit ? "HIT" : "PARTIAL",
      hitSummary: hit
        ? "赛果与赛前比分方向一致，关键判断主要来自基本面和临场数据变化。"
        : "赛果与赛前判断存在偏差，但部分节奏和风险提示仍有参考价值。",
      missReason: hit ? undefined : "临场阵容、比赛节奏或市场热度变化超出赛前输入信息。",
      correctionNote: "后续复盘需要补充首发阵容、赛中事件和赔率临场变化，降低单一信息源权重。",
    };
  },
};
