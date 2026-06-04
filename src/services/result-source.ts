import { prisma } from "@/lib/db";
import { getChinaLotterySalesDayWindow } from "@/lib/beijing-time";

type ResultRow = {
  matchNum: string;
  homeScore: number;
  awayScore: number;
};

function formatBeijingDateCompact(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("-", "");
}

function getPreviousSalesWindow(date = new Date()) {
  const current = getChinaLotterySalesDayWindow(date);
  const dayMs = 24 * 60 * 60 * 1000;
  return {
    start: new Date(current.start.getTime() - dayMs),
    end: new Date(current.end.getTime() - dayMs),
  };
}

function getMatchNumFromVenue(venue: string | null) {
  return venue?.match(/\b(\d{3})\b/)?.[1] ?? null;
}

function parseScore(value: string | undefined) {
  const match = value?.replace(/\s+/g, "").match(/^(\d+):(\d+)$/);
  if (!match) {
    return null;
  }

  return {
    homeScore: Number(match[1]),
    awayScore: Number(match[2]),
  };
}

function parseCpbaoResults(html: string) {
  const rows = html.match(/<tr\b[^>]*\bmk="\d{8}-\d{3}"[\s\S]*?<\/tr>/g) ?? [];
  const parsed = new Map<string, ResultRow>();

  for (const row of rows) {
    const matchNum = row.match(/\bmk="\d{8}-(\d{3})"/)?.[1];
    const scoreText = row.match(/<span class="d_time[^"]*"[^>]*>([\s\S]*?)<\/span>/)?.[1]?.replace(/<[^>]*>/g, "");
    const score = parseScore(scoreText);
    if (!matchNum || !score) {
      continue;
    }

    parsed.set(matchNum, { matchNum, ...score });
  }

  return parsed;
}

async function fetchCpbaoResults(salesDate: string) {
  const sourceUrl = `https://www.cpbao.com/jczq/scheme!editNew.action?matchDate=${salesDate}&passMode=PASS&playType=SPF`;
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`CPBao result source failed: ${response.status} ${errorText.slice(0, 200)}`);
  }

  return parseCpbaoResults(await response.text());
}

export async function syncPreviousSalesDayResults(date = new Date()) {
  const window = getPreviousSalesWindow(date);
  const salesDate = formatBeijingDateCompact(window.start);
  const resultRows = await fetchCpbaoResults(salesDate);
  const matches = await prisma.match.findMany({
    where: {
      source: "china_sports_lottery",
      kickoffAt: { gte: window.start, lte: window.end },
    },
    orderBy: { kickoffAt: "asc" },
  });

  let updated = 0;
  let skipped = 0;
  const missing: string[] = [];

  for (const match of matches) {
    const matchNum = getMatchNumFromVenue(match.venue);
    const result = matchNum ? resultRows.get(matchNum) : undefined;
    if (!result) {
      skipped += 1;
      missing.push(match.id);
      continue;
    }

    if (match.status === "FINISHED" && match.homeScore === result.homeScore && match.awayScore === result.awayScore) {
      skipped += 1;
      continue;
    }

    await prisma.match.update({
      where: { id: match.id },
      data: {
        status: "FINISHED",
        homeScore: result.homeScore,
        awayScore: result.awayScore,
      },
    });
    updated += 1;
  }

  return {
    updated,
    skipped,
    candidates: matches.length,
    resultRows: resultRows.size,
    missing,
    source: "cpbao:jczq",
    salesDate,
  };
}
