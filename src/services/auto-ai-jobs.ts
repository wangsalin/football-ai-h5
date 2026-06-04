import type { AppUser } from "@/lib/auth";
import { getLlmProvider } from "@/adapters/llm";
import { validateCompliantAnalysis } from "@/services/analysis/guardrails";
import type { AiAnalysisInput } from "@/services/analysis/schema";
import { prisma } from "@/lib/db";
import { getBeijingDayPredictionWindow } from "@/lib/beijing-time";
import { getAiSettings, getAutomationSettings } from "@/services/admin-settings";
import { createAdminPrediction, createAdminReview, updateAdminPrediction } from "@/services/admin-data";
import { captureOddsSnapshotsForSalesWindow } from "@/services/odds-source";
import { syncPreviousSalesDayResults } from "@/services/result-source";

function serializeJobError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer ***").slice(0, 500);
}

function buildPredictionInput(match: {
  id?: string;
  kickoffAt: Date;
  venue: string | null;
  competition: { name: string };
  homeTeam: { name: string };
  awayTeam: { name: string };
  stats?: {
    homeRank: number | null;
    awayRank: number | null;
    homeRecentForm: string | null;
    awayRecentForm: string | null;
    summary: string | null;
  } | null;
  injuries?: Array<{
    playerName: string | null;
    description: string;
    teamId: string | null;
  }>;
  oddsSnapshots?: Array<{
    europeanHome: number | null;
    europeanDraw: number | null;
    europeanAway: number | null;
    asianLine: string | null;
    goalLine: string | null;
    source: string | null;
    capturedAt: Date;
  }>;
}): AiAnalysisInput {
  const oddsSnapshots = match.oddsSnapshots ?? [];
  const initialOdds = oddsSnapshots[0];
  const currentOdds = oddsSnapshots[oddsSnapshots.length - 1] ?? initialOdds;
  const injuries = match.injuries ?? [];

  return {
    match: {
      competition: match.competition.name,
      kickoffAt: match.kickoffAt.toISOString(),
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      venue: match.venue ?? undefined,
    },
    basic: {
      homeRank: match.stats?.homeRank ?? undefined,
      awayRank: match.stats?.awayRank ?? undefined,
      homeRecentForm: match.stats?.homeRecentForm ?? undefined,
      awayRecentForm: match.stats?.awayRecentForm ?? undefined,
      motivationSummary: match.stats?.summary ?? "Auto generated. Verify ranking, form, motivation and home/away context with web search.",
    },
    lineup: {
      homeInjuries: injuries.map((item) => `${item.playerName ?? "Player"}: ${item.description}`),
      awayInjuries: [],
      scheduleImpact: "Verify recent schedule, rest days, travel distance and rotation risk with web search.",
    },
    odds: {
      europeanInitial: {
        home: initialOdds?.europeanHome ?? 2.2,
        draw: initialOdds?.europeanDraw ?? 3.2,
        away: initialOdds?.europeanAway ?? 3.1,
      },
      europeanCurrent: {
        home: currentOdds?.europeanHome ?? initialOdds?.europeanHome ?? 2.2,
        draw: currentOdds?.europeanDraw ?? initialOdds?.europeanDraw ?? 3.2,
        away: currentOdds?.europeanAway ?? initialOdds?.europeanAway ?? 3.1,
      },
      asianInitial: initialOdds?.asianLine ?? "Not provided",
      asianCurrent: currentOdds?.asianLine ?? initialOdds?.asianLine ?? "Not provided",
      goalLineInitial: initialOdds?.goalLine ?? "Not provided",
      goalLineCurrent: currentOdds?.goalLine ?? initialOdds?.goalLine ?? "Not provided",
      source: currentOdds?.source ?? initialOdds?.source ?? "No real odds source provided",
      capturedAt: currentOdds?.capturedAt?.toISOString() ?? initialOdds?.capturedAt?.toISOString(),
    },
  };
}

export async function runAutoPredictions(actor: AppUser) {
  const [settings, aiSettings] = await Promise.all([getAutomationSettings(), getAiSettings()]);
  if (!settings.predictionEnabled) {
    return { created: 0, skipped: 0, message: "自动预测未启用" };
  }

  const now = new Date();
  const window = getBeijingDayPredictionWindow(now);
  if (now > window.cutoffAt) {
    return {
      created: 0,
      skipped: 0,
      message: `ä»Šæ—¥é¢„æµ‹æˆªæ­¢æ—¶é—´å·²è¿‡ï¼ˆåŒ—äº¬æ—¶é—´ ${String(window.cutoffHour).padStart(2, "0")}:00ï¼‰`,
    };
  }

  const oddsResult = await captureOddsSnapshotsForSalesWindow().catch((error) => ({
    created: 0,
    skipped: 0,
    error: serializeJobError(error),
  }));

  const matches = await prisma.match.findMany({
    where: {
      kickoffAt: { gte: now > window.start ? now : window.start, lte: window.end },
      prediction: null,
      status: "SCHEDULED",
      source: "china_sports_lottery",
    },
    include: {
      competition: true,
      homeTeam: true,
      awayTeam: true,
      stats: true,
      injuries: true,
      oddsSnapshots: { orderBy: { capturedAt: "asc" }, take: 10 },
    },
    take: 100,
    orderBy: { kickoffAt: "asc" },
  });

  let created = 0;
  let skipped = 0;
  const errors: Array<{ matchId: string; match: string; reason: string }> = [];


  for (const match of matches) {
    const matchTitle = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
    try {
      const draft = await getLlmProvider(aiSettings).generatePredictionDraft(buildPredictionInput(match), aiSettings);
      const compliance = validateCompliantAnalysis(draft);
      if (!compliance.ok) {
        skipped += 1;
        errors.push({
          matchId: match.id,
          match: matchTitle,
          reason: `内容合规校验未通过：${compliance.words.join("、")}`,
        });
        continue;
      }

      await createAdminPrediction({
        matchId: match.id,
        summary: draft.summary,
        winDrawLossPick: draft.winDrawLossPick,
        handicapPick: draft.handicapPick,
        scorePicks: draft.scorePicks,
        totalGoalsPick: draft.totalGoalsPick,
        halfFullPick: draft.halfFullPick,
        riskLevel: draft.riskLevel,
        confidence: draft.confidence,
        coldAlertReason: draft.coldAlertReason,
        sections: draft.sections,
        status: settings.predictionStatus,
        actor,
      });
      created += 1;
    } catch (error) {
      console.error("Auto prediction failed", error);
      errors.push({ matchId: match.id, match: matchTitle, reason: serializeJobError(error) });
      skipped += 1;
    }
  }

  return { created, skipped, candidates: matches.length, oddsResult, errors };
}

export async function runPrematchReanalysis(actor: AppUser) {
  const [settings, aiSettings] = await Promise.all([getAutomationSettings(), getAiSettings()]);
  if (!settings.prematchReanalysisEnabled) {
    return { created: 0, updated: 0, skipped: 0, message: "赛前再次分析未启用" };
  }

  const now = new Date();
  const target = new Date(now.getTime() + settings.prematchReanalysisMinutesBefore * 60 * 1000);
  const halfWindowMs = Math.max(1, settings.prematchReanalysisWindowMinutes) * 60 * 1000;
  const start = new Date(target.getTime() - halfWindowMs);
  const end = new Date(target.getTime() + halfWindowMs);

  const matches = await prisma.match.findMany({
    where: {
      kickoffAt: { gte: start, lte: end },
      status: "SCHEDULED",
      source: "china_sports_lottery",
      venue: { startsWith: "中国体彩竞彩足球" },
    },
    include: {
      competition: true,
      homeTeam: true,
      awayTeam: true,
      stats: true,
      injuries: true,
      oddsSnapshots: { orderBy: { capturedAt: "asc" }, take: 10 },
      prediction: true,
    },
    take: 30,
    orderBy: { kickoffAt: "asc" },
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: Array<{ matchId: string; match: string; reason: string }> = [];

  const oddsResult =
    matches.length > 0
      ? await captureOddsSnapshotsForSalesWindow(matches.map((match) => match.id)).catch((error) => ({
          created: 0,
          skipped: 0,
          error: serializeJobError(error),
        }))
      : { created: 0, skipped: 0 };

  const freshOdds =
    matches.length > 0
      ? await prisma.oddsSnapshot.findMany({
          where: { matchId: { in: matches.map((match) => match.id) } },
          orderBy: { capturedAt: "asc" },
        })
      : [];
  const oddsByMatchId = freshOdds.reduce<Map<string, typeof freshOdds>>((map, snapshot) => {
    const current = map.get(snapshot.matchId) ?? [];
    current.push(snapshot);
    map.set(snapshot.matchId, current);
    return map;
  }, new Map());

  for (const match of matches) {
    const matchTitle = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
    const eventPath = `/matches/${match.id}`;
    const existingEvent = await prisma.systemEvent.findFirst({
      where: {
        eventName: "PREMATCH_REANALYSIS",
        path: eventPath,
      },
      select: { id: true },
    });

    if (existingEvent) {
      skipped += 1;
      continue;
    }

    try {
      const draft = await getLlmProvider(aiSettings).generatePredictionDraft(
        buildPredictionInput({ ...match, oddsSnapshots: oddsByMatchId.get(match.id) ?? match.oddsSnapshots }),
        aiSettings,
      );
      const compliance = validateCompliantAnalysis(draft);
      if (!compliance.ok) {
        skipped += 1;
        errors.push({
          matchId: match.id,
          match: matchTitle,
          reason: `内容合规校验未通过：${compliance.words.join("、")}`,
        });
        continue;
      }

      if (match.prediction) {
        await updateAdminPrediction(match.prediction.id, {
          matchId: match.id,
          summary: draft.summary,
          winDrawLossPick: draft.winDrawLossPick,
          handicapPick: draft.handicapPick,
          scorePicks: draft.scorePicks,
          totalGoalsPick: draft.totalGoalsPick,
          halfFullPick: draft.halfFullPick,
          riskLevel: draft.riskLevel,
          confidence: draft.confidence,
          coldAlertReason: draft.coldAlertReason,
          sections: draft.sections,
          status: settings.prematchReanalysisStatus,
          actor,
        });
        updated += 1;
      } else {
        await createAdminPrediction({
          matchId: match.id,
          summary: draft.summary,
          winDrawLossPick: draft.winDrawLossPick,
          handicapPick: draft.handicapPick,
          scorePicks: draft.scorePicks,
          totalGoalsPick: draft.totalGoalsPick,
          halfFullPick: draft.halfFullPick,
          riskLevel: draft.riskLevel,
          confidence: draft.confidence,
          coldAlertReason: draft.coldAlertReason,
          sections: draft.sections,
          status: settings.prematchReanalysisStatus,
          actor,
        });
        created += 1;
      }

      await prisma.systemEvent.create({
        data: {
          eventName: "PREMATCH_REANALYSIS",
          userId: actor.id,
          path: eventPath,
          payload: {
            matchId: match.id,
            minutesBefore: settings.prematchReanalysisMinutesBefore,
            windowMinutes: settings.prematchReanalysisWindowMinutes,
            kickoffAt: match.kickoffAt.toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Prematch reanalysis failed", error);
      errors.push({ matchId: match.id, match: matchTitle, reason: serializeJobError(error) });
      skipped += 1;
    }
  }

  return { created, updated, skipped, candidates: matches.length, oddsResult, errors };
}

export async function runAutoReviews(actor: AppUser) {
  const [settings, aiSettings] = await Promise.all([getAutomationSettings(), getAiSettings()]);
  if (!settings.reviewEnabled) {
    return { created: 0, skipped: 0, message: "自动复盘未启用" };
  }

  const resultSync = await syncPreviousSalesDayResults().catch((error) => ({
    updated: 0,
    skipped: 0,
    error: serializeJobError(error),
  }));

  const before = new Date(Date.now() - settings.reviewDelayHours * 60 * 60 * 1000);
  const matches = await prisma.match.findMany({
    where: {
      kickoffAt: { lte: before },
      status: "FINISHED",
      homeScore: { not: null },
      awayScore: { not: null },
      reviews: { none: {} },
    },
    include: { competition: true, homeTeam: true, awayTeam: true, prediction: true },
    take: 20,
    orderBy: { kickoffAt: "desc" },
  });

  let created = 0;
  let skipped = 0;

  for (const match of matches) {
    try {
      const actualResult = `${match.homeScore}-${match.awayScore}`;
      const provider = getLlmProvider(aiSettings);
      const draft = provider.generateReviewDraft
        ? await provider.generateReviewDraft(
            {
              matchTitle: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
              kickoffAt: match.kickoffAt.toISOString(),
              actualResult,
              predictedSummary: match.prediction?.summary,
              scorePicks: match.prediction?.scorePicks,
            },
            aiSettings,
          )
        : {
            resultType: "PARTIAL" as const,
            hitSummary: "自动复盘已生成，需人工补充赛中事件。",
          };

      await createAdminReview({
        matchId: match.id,
        predictionId: match.prediction?.id,
        actualResult,
        resultType: draft.resultType,
        hitSummary: draft.hitSummary,
        missReason: draft.missReason,
        correctionNote: draft.correctionNote,
        status: settings.reviewStatus,
        actor,
      });
      created += 1;
    } catch (error) {
      console.error("Auto review failed", error);
      skipped += 1;
    }
  }

  return { created, skipped, resultSync };
}
