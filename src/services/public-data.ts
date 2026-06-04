import { prisma } from "@/lib/db";
import { getChinaLotterySalesDayWindow } from "@/lib/beijing-time";
import {
  getMatchById as getFallbackMatchById,
  matches as fallbackMatches,
  reviews as fallbackReviews,
  type MatchPreview,
  type ReviewItem,
} from "@/lib/mock-data";

type PredictionWithSections = {
  summary: string;
  winDrawLossPick: string;
  handicapPick: string | null;
  scorePicks: string[];
  totalGoalsPick: string | null;
  halfFullPick: string | null;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  coldAlertReason: string | null;
  sections: Array<{
    sectionKey: string;
    title: string;
    content: string;
  }>;
};

type MatchRow = {
  id: string;
  kickoffAt: Date;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";
  homeScore: number | null;
  awayScore: number | null;
  competition: { name: string };
  homeTeam: { name: string };
  awayTeam: { name: string };
  prediction: PredictionWithSections | null;
  oddsSnapshots: Array<{
    europeanHome: number | null;
    europeanDraw: number | null;
    europeanAway: number | null;
    asianLine: string | null;
    goalLine: string | null;
    source: string | null;
    capturedAt: Date;
  }>;
};

const chinaSportsLotterySource = "china_sports_lottery";

function getShanghaiDayRange(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = formatter.format(date);
  const start = new Date(`${today}T00:00:00+08:00`);
  const end = new Date(`${today}T23:59:59.999+08:00`);
  return { start, end, today };
}

function getUpcomingWindow(date = new Date()) {
  return getChinaLotterySalesDayWindow(date);
}

function getPreviousSalesWindow(date = new Date()) {
  const current = getChinaLotterySalesDayWindow(date);
  const dayMs = 24 * 60 * 60 * 1000;
  return {
    start: new Date(current.start.getTime() - dayMs),
    end: new Date(current.end.getTime() - dayMs),
  };
}

function normalizeTeamName(value: string) {
  return value
    .replace(/北马其顿/g, "马其顿")
    .replace(/乌兹别克斯坦/g, "乌兹别克")
    .replace(/\s+/g, "")
    .trim();
}

function dedupeLotteryMatches(rows: MatchRow[]) {
  const byKey = new Map<string, MatchRow>();

  for (const row of rows) {
    const key = `${row.kickoffAt.getTime()}-${normalizeTeamName(row.homeTeam.name)}`;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, row);
      continue;
    }

    const existingScore =
      (existing.prediction ? 2 : 0) +
      (existing.awayTeam.name.length > row.awayTeam.name.length ? 1 : 0) +
      (existing.oddsSnapshots.length > 0 ? 1 : 0);
    const rowScore =
      (row.prediction ? 2 : 0) +
      (row.awayTeam.name.length > existing.awayTeam.name.length ? 1 : 0) +
      (row.oddsSnapshots.length > 0 ? 1 : 0);

    if (rowScore > existingScore) {
      byKey.set(key, row);
    }
  }

  return [...byKey.values()].sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());
}

export function getChinaTodayLabel() {
  return getShanghaiDayRange().today;
}

export function getChinaYesterdayLabel() {
  return getShanghaiDayRange(new Date(Date.now() - 24 * 60 * 60 * 1000)).today;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("/", "-");
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function mapMatch(row: MatchRow): MatchPreview {
  const prediction = row.prediction;
  const initialOdds = row.oddsSnapshots[0];
  const currentOdds = row.oddsSnapshots[row.oddsSnapshots.length - 1] ?? initialOdds;

  return {
    id: row.id,
    date: formatDate(row.kickoffAt),
    competition: row.competition.name,
    kickoffTime: formatTime(row.kickoffAt),
    homeTeam: row.homeTeam.name,
    awayTeam: row.awayTeam.name,
    status: row.status,
    riskLevel: prediction?.riskLevel ?? "MEDIUM",
    confidence: prediction?.confidence ?? 5.5,
    summary: prediction?.summary ?? "暂无已发布分析，等待分析师更新。",
    winDrawLossPick: prediction?.winDrawLossPick ?? "待定",
    handicapPick: prediction?.handicapPick ?? "待定",
    totalGoalsPick: prediction?.totalGoalsPick ?? "待定",
    halfFullPick: prediction?.halfFullPick ?? "待定",
    coldAlertReason: prediction?.coldAlertReason ?? "暂无冷门预警。",
    scorePicks: prediction?.scorePicks?.length === 3 ? prediction.scorePicks : ["待定", "待定", "待定"],
    sections:
      prediction?.sections?.map((section) => ({
        key: section.sectionKey,
        title: section.title,
        content: section.content,
      })) ?? [],
    odds: {
      europeanInitial: initialOdds?.europeanHome
        ? `${initialOdds.europeanHome} / ${initialOdds.europeanDraw ?? "-"} / ${initialOdds.europeanAway ?? "-"}`
        : "\u6682\u65e0",
      europeanCurrent: currentOdds?.europeanHome
        ? `${currentOdds.europeanHome} / ${currentOdds.europeanDraw ?? "-"} / ${currentOdds.europeanAway ?? "-"}`
        : "\u6682\u65e0",
      asianInitial: initialOdds?.asianLine ?? "\u6682\u65e0",
      asianCurrent: currentOdds?.asianLine ?? initialOdds?.asianLine ?? "\u6682\u65e0",
      goalLineInitial: initialOdds?.goalLine ?? "\u6682\u65e0",
      goalLineCurrent: currentOdds?.goalLine ?? initialOdds?.goalLine ?? "\u6682\u65e0",
      source: currentOdds?.source ?? initialOdds?.source ?? undefined,
      capturedAt: currentOdds?.capturedAt ? formatTime(currentOdds.capturedAt) : undefined,
    },
  };
}

export async function getPublicMatches(): Promise<MatchPreview[]> {
  try {
    const { start, end } = getUpcomingWindow();
    const rows = await prisma.match.findMany({
      where: {
        source: chinaSportsLotterySource,
        kickoffAt: { gte: start, lte: end },
      },
      orderBy: { kickoffAt: "asc" },
      include: {
        competition: true,
        homeTeam: true,
        awayTeam: true,
        oddsSnapshots: { orderBy: { capturedAt: "asc" }, take: 10 },
        prediction: {
          include: {
            sections: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    return dedupeLotteryMatches(rows as MatchRow[]).map((row) => mapMatch(row));
  } catch {
    return fallbackMatches;
  }
}

export async function getTodayMatches(): Promise<MatchPreview[]> {
  try {
    const { start, end } = getUpcomingWindow();
    const rows = await prisma.match.findMany({
      where: {
        source: chinaSportsLotterySource,
        kickoffAt: { gte: start, lte: end },
      },
      orderBy: { kickoffAt: "asc" },
      include: {
        competition: true,
        homeTeam: true,
        awayTeam: true,
        oddsSnapshots: { orderBy: { capturedAt: "asc" }, take: 10 },
        prediction: {
          include: {
            sections: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    return dedupeLotteryMatches(rows as MatchRow[]).map((row) => mapMatch(row));
  } catch {
    return [];
  }
}

export async function getPublicMatchById(id: string): Promise<MatchPreview | undefined> {
  try {
    const row = await prisma.match.findFirst({
      where: { id, source: chinaSportsLotterySource },
      include: {
        competition: true,
        homeTeam: true,
        awayTeam: true,
        oddsSnapshots: { orderBy: { capturedAt: "asc" }, take: 10 },
        prediction: {
          include: {
            sections: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    return row ? mapMatch(row as MatchRow) : getFallbackMatchById(id);
  } catch {
    return getFallbackMatchById(id);
  }
}

export async function getPublicReviews(): Promise<ReviewItem[]> {
  try {
    const { start, end } = getPreviousSalesWindow();
    const rows = await prisma.matchReview.findMany({
      where: {
        status: "PUBLISHED",
        match: {
          source: chinaSportsLotterySource,
          kickoffAt: { gte: start, lte: end },
        },
      },
      orderBy: { publishedAt: "desc" },
      include: {
        match: {
          include: {
            competition: true,
            homeTeam: true,
            awayTeam: true,
            prediction: true,
          },
        },
      },
    });

    return rows.map((review) => ({
      id: review.id,
      matchId: review.matchId,
      competition: review.match.competition.name,
      teams: `${review.match.homeTeam.name} vs ${review.match.awayTeam.name}`,
      predicted: review.match.prediction?.summary ?? "未关联预测",
      actualResult: review.actualResult,
      resultType: review.resultType as ReviewItem["resultType"],
      hitSummary: review.hitSummary,
      missReason: review.missReason ?? undefined,
    }));
  } catch {
    return fallbackReviews;
  }
}
