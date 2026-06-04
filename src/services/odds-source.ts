import { prisma } from "@/lib/db";
import { getChinaLotterySalesDayWindow } from "@/lib/beijing-time";

type CpbaoOddsRow = {
  matchNum: string;
  handicap: string | null;
  spfOdds?: number[];
  goalOdds?: number[];
};

type OddsSnapshotInput = {
  europeanHome: number | null;
  europeanDraw: number | null;
  europeanAway: number | null;
  asianLine: string | null;
  goalLine: string | null;
  source: string;
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

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function parseNumberList(value: string | undefined) {
  return (value ?? "")
    .split(/\s+/)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function parseCpbaoRows(html: string) {
  const rows = html.match(/<tr\b[^>]*\bmk="\d{8}-\d{3}"[\s\S]*?<\/tr>/g) ?? [];
  const parsed = new Map<string, CpbaoOddsRow>();

  for (const row of rows) {
    const matchNum = row.match(/\bmk="\d{8}-(\d{3})"/)?.[1];
    if (!matchNum) {
      continue;
    }

    parsed.set(matchNum, {
      matchNum,
      handicap: row.match(/\brq="([^"]*)"/)?.[1] ?? null,
      spfOdds: parseNumberList(row.match(/id="sps_[^"]+"\s+value="([^"]*)"/)?.[1]),
    });
  }

  return parsed;
}

async function fetchCpbaoPlayType(playType: "SPF" | "JQS", salesDate: string) {
  const sourceUrl = `https://www.cpbao.com/jczq/scheme!editNew.action?matchDate=${salesDate}&passMode=PASS&playType=${playType}`;
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`CPBao ${playType} odds source failed: ${response.status} ${errorText.slice(0, 200)}`);
  }

  return parseCpbaoRows(await response.text());
}

function getMatchNumFromVenue(venue: string | null) {
  return venue?.match(/\b(\d{3})\b/)?.[1] ?? null;
}

function formatHandicapLine(handicap: string | null, odds: number[]) {
  if (odds.length < 6) {
    return null;
  }

  const line = handicap && handicap !== "0" ? `让球${handicap}` : "让球";
  return `${line}：${odds[3].toFixed(2)} / ${odds[4].toFixed(2)} / ${odds[5].toFixed(2)}`;
}

function formatGoalLine(odds: number[] | undefined) {
  if (!odds || odds.length < 8) {
    return null;
  }

  return `总进球赔率：0:${odds[0].toFixed(2)} 1:${odds[1].toFixed(2)} 2:${odds[2].toFixed(2)} 3:${odds[3].toFixed(
    2,
  )} 4:${odds[4].toFixed(2)} 5:${odds[5].toFixed(2)} 6:${odds[6].toFixed(2)} 7+:${odds[7].toFixed(2)}`;
}

function buildSnapshot(row: CpbaoOddsRow | undefined, goalRow: CpbaoOddsRow | undefined): OddsSnapshotInput | null {
  if (!row?.spfOdds || row.spfOdds.length < 3) {
    return null;
  }

  return {
    europeanHome: row.spfOdds[0],
    europeanDraw: row.spfOdds[1],
    europeanAway: row.spfOdds[2],
    asianLine: formatHandicapLine(row.handicap, row.spfOdds),
    goalLine: formatGoalLine(goalRow?.spfOdds),
    source: "cpbao:jczq",
  };
}

function sameSnapshot(
  existing: {
    europeanHome: number | null;
    europeanDraw: number | null;
    europeanAway: number | null;
    asianLine: string | null;
    goalLine: string | null;
    source: string | null;
  },
  next: OddsSnapshotInput,
) {
  return (
    existing.europeanHome === next.europeanHome &&
    existing.europeanDraw === next.europeanDraw &&
    existing.europeanAway === next.europeanAway &&
    existing.asianLine === next.asianLine &&
    existing.goalLine === next.goalLine &&
    existing.source === next.source
  );
}

export async function captureOddsSnapshotsForSalesWindow(matchIds?: string[]) {
  const window = getChinaLotterySalesDayWindow();
  const salesDate = formatBeijingDateCompact(window.start);
  const [spfRows, goalRows] = await Promise.all([fetchCpbaoPlayType("SPF", salesDate), fetchCpbaoPlayType("JQS", salesDate)]);

  const matches = await prisma.match.findMany({
    where: {
      id: matchIds?.length ? { in: matchIds } : undefined,
      source: "china_sports_lottery",
      kickoffAt: { gte: window.start, lte: window.end },
      status: "SCHEDULED",
    },
    include: {
      oddsSnapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
    },
    orderBy: { kickoffAt: "asc" },
  });

  let created = 0;
  let skipped = 0;
  const missing: string[] = [];

  for (const match of matches) {
    const matchNum = getMatchNumFromVenue(match.venue);
    if (!matchNum) {
      skipped += 1;
      missing.push(match.id);
      continue;
    }

    const snapshot = buildSnapshot(spfRows.get(matchNum), goalRows.get(matchNum));
    if (!snapshot) {
      skipped += 1;
      missing.push(match.id);
      continue;
    }

    const latest = match.oddsSnapshots[0];
    if (latest && sameSnapshot(latest, snapshot)) {
      skipped += 1;
      continue;
    }

    await prisma.oddsSnapshot.create({
      data: {
        matchId: match.id,
        europeanHome: snapshot.europeanHome,
        europeanDraw: snapshot.europeanDraw,
        europeanAway: snapshot.europeanAway,
        asianLine: snapshot.asianLine,
        goalLine: snapshot.goalLine,
        source: snapshot.source,
      },
    });
    created += 1;
  }

  return {
    created,
    skipped,
    candidates: matches.length,
    missing,
    source: "cpbao:jczq",
    salesDate,
  };
}
