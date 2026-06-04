import { z } from "zod";
import type { AppUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAdminMatch } from "@/services/admin-data";
import { matchSearchSystemPrompt } from "@/services/ai-prompts";
import { getAiSettings, getMatchSourceSettings } from "@/services/admin-settings";
import { getChinaLotterySalesDayWindow } from "@/lib/beijing-time";

const sourceMatchSchema = z.object({
  competitionName: z.string().trim().min(1),
  homeTeamName: z.string().trim().min(1),
  awayTeamName: z.string().trim().min(1),
  kickoffAt: z.string().trim().min(1),
  status: z.string().trim().optional().default("SCHEDULED"),
  venue: z.string().trim().optional().default(""),
  homeScore: z.number().int().min(0).nullable().optional(),
  awayScore: z.number().int().min(0).nullable().optional(),
  sourceUrl: z.string().trim().optional(),
});

const sourceResponseSchema = z.union([z.array(z.unknown()), z.object({ matches: z.array(z.unknown()) })]);

type SourceMatch = {
  competitionName: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: string;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";
  venue: string;
  homeScore?: number | null;
  awayScore?: number | null;
  sourceUrl?: string;
};

type ResponsesApiOutput = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
};

type SportteryMatch = {
  matchId?: number | string;
  matchNumStr?: string;
  leagueAllName?: string;
  homeTeamAllName?: string;
  awayTeamAllName?: string;
  matchDate?: string;
  matchTime?: string;
  matchStatus?: string;
  remark?: string;
};

type SportteryResponse = {
  value?: {
    matchInfoList?: Array<{
      subMatchList?: SportteryMatch[];
    }>;
  };
};

function extractText(response: ResponsesApiOutput) {
  if (response.output_text) {
    return response.output_text;
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n") ?? ""
  );
}

function parseJsonText(text: string) {
  return JSON.parse(text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "")) as unknown;
}

function normalizeStatus(value: string): SourceMatch["status"] {
  const normalized = value.trim().toUpperCase();
  if (normalized === "LIVE" || value.includes("进行")) return "LIVE";
  if (normalized === "FINISHED" || value.includes("完") || value.includes("赛果")) return "FINISHED";
  if (normalized === "CANCELLED" || value.includes("取消") || value.includes("延期")) return "CANCELLED";
  return "SCHEDULED";
}

function normalizeKickoffAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getChinaDateLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatBeijingDateTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replaceAll("/", "-");
}

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function normalizeMatches(value: unknown): SourceMatch[] {
  const parsed = sourceResponseSchema.parse(value);
  const rawMatches = Array.isArray(parsed) ? parsed : parsed.matches;

  return rawMatches.flatMap((item) => {
    const result = sourceMatchSchema.safeParse(item);
    if (!result.success) {
      return [];
    }

    const kickoffAt = normalizeKickoffAt(result.data.kickoffAt);
    if (!kickoffAt) {
      return [];
    }

    return [
      {
        ...result.data,
        kickoffAt,
        status: normalizeStatus(result.data.status),
      },
    ];
  });
}

async function fetchExternalMatches(apiUrl: string) {
  if (!apiUrl.trim()) {
    throw new Error("Match source API URL is not configured.");
  }

  const response = await fetch(apiUrl, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Match source API failed: ${response.status} ${errorText.slice(0, 300)}`);
  }

  return normalizeMatches(await response.json());
}

async function fetchOpenAiSearchMatches() {
  const [sourceSettings, aiSettings] = await Promise.all([getMatchSourceSettings(), getAiSettings()]);
  const apiKey = aiSettings.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API Key is not configured.");
  }

  const endpoint = `${aiSettings.apiBaseUrl.replace(/\/+$/, "")}/responses`;
  const today = getChinaDateLabel();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: sourceSettings.searchModel || aiSettings.model,
      instructions: matchSearchSystemPrompt,
      input: `${sourceSettings.searchPromptTemplate}

当前北京时间日期：${today}。

同步目标：
- 优先返回今天 ${today} 中国体育彩票竞彩足球已经开售或官方可核验的全部足球场次，包括北京时间今天深夜和次日凌晨但属于今天竞彩开售列表的赛事。
- 如果今天场次已经不足 30 场，再补充未来 72 小时内中国体彩竞彩足球可核验场次。
- 不要只返回少数热门场次；必须尽量完整覆盖官方开售列表。
- 如果中国体彩网页面暂时无法直接访问，可以结合竞彩网/竞彩赛程页、公开可核验的中国体彩竞彩足球页面交叉确认。

Return a JSON array only. Each item must include:
competitionName, homeTeamName, awayTeamName, kickoffAt(ISO8601), status, venue, sourceUrl.
Return future football matches only, max 30. sourceUrl must verify that the match is listed by China Sports Lottery / Jingcai football.`,
      tools: [{ type: "web_search" }],
      tool_choice: "auto",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`OpenAI match search failed: ${response.status} ${errorText.slice(0, 300)}`);
  }

  return normalizeMatches(parseJsonText(extractText((await response.json()) as ResponsesApiOutput)));
}

async function fetchOpenAiSearchMatchesForSalesWindow() {
  const [sourceSettings, aiSettings] = await Promise.all([getMatchSourceSettings(), getAiSettings()]);
  const apiKey = aiSettings.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API Key is not configured.");
  }

  const window = getChinaLotterySalesDayWindow();
  const endpoint = `${aiSettings.apiBaseUrl.replace(/\/+$/, "")}/responses`;
  const prompt = `${sourceSettings.searchPromptTemplate}

Current Beijing date: ${getChinaDateLabel()}.
China Sports Lottery football sales-day window, Beijing time:
${formatBeijingDateTime(window.start)} to ${formatBeijingDateTime(window.end)}.

Return only China Sports Lottery / Jingcai football matches whose kickoffAt is inside this exact sales-day window.
Do not include matches outside this window. If no verified match is found inside this window, return [].
Return JSON array only. Fields: competitionName, homeTeamName, awayTeamName, kickoffAt, status, venue, sourceUrl.
sourceUrl must verify the match is listed by China Sports Lottery / Jingcai football. Max 50 matches.`;

  let lastErrorText = "";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: sourceSettings.searchModel || aiSettings.model,
        instructions: matchSearchSystemPrompt,
        input: prompt,
        tools: [{ type: "web_search" }],
        tool_choice: "auto",
      }),
    });

    if (response.ok) {
      return normalizeMatches(parseJsonText(extractText((await response.json()) as ResponsesApiOutput)));
    }

    lastErrorText = `${response.status} ${(await response.text().catch(() => "")).slice(0, 300)}`;
    if (response.status !== 429 && response.status < 500) {
      break;
    }
    await sleep(attempt * 1500);
  }

  throw new Error(`OpenAI match search failed: ${lastErrorText}`);
}

async function fetchSportteryMatches(): Promise<SourceMatch[]> {
  const endpoint =
    "https://webapi.sporttery.cn/gateway/uniform/football/getMatchCalculatorV1.qry?channel=c&poolCode=hhad,had";
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      Referer: "https://www.sporttery.cn/jc/jsq/zqspf/",
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Sporttery match source failed: ${response.status} ${errorText.slice(0, 300)}`);
  }

  const data = (await response.json()) as SportteryResponse;
  const rawMatches = data.value?.matchInfoList?.flatMap((group) => group.subMatchList ?? []) ?? [];

  if (rawMatches.length === 0) {
    throw new Error("Sporttery match source returned no matches.");
  }

  return rawMatches.flatMap((match) => {
    const competitionName = match.leagueAllName?.trim();
    const homeTeamName = match.homeTeamAllName?.trim();
    const awayTeamName = match.awayTeamAllName?.trim();
    const matchDate = match.matchDate?.trim();
    const matchTime = match.matchTime?.trim();
    if (!competitionName || !homeTeamName || !awayTeamName || !matchDate || !matchTime) {
      return [];
    }

    const kickoffAt = normalizeKickoffAt(`${matchDate}T${matchTime}+08:00`);
    if (!kickoffAt) {
      return [];
    }

    return [
      {
        competitionName,
        homeTeamName,
        awayTeamName,
        kickoffAt,
        status: normalizeStatus(match.matchStatus ?? "SCHEDULED"),
        venue: match.matchNumStr ? `中国体彩竞彩足球 ${match.matchNumStr}` : "中国体彩竞彩足球",
        sourceUrl: match.matchId
          ? `https://www.sporttery.cn/jc/zqdz/index.html?showType=2&mid=${match.matchId}`
          : "https://www.sporttery.cn/jc/jsq/zqspf/",
      },
    ];
  });
}

async function fetchCpbaoMatches(): Promise<SourceMatch[]> {
  const window = getChinaLotterySalesDayWindow();
  const salesDate = formatBeijingDateCompact(window.start);
  const sourceUrl = `https://www.cpbao.com/jczq/scheme!editNew.action?matchDate=${salesDate}&passMode=SINGLE&playType=BQQ`;
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`CPBao match source failed: ${response.status} ${errorText.slice(0, 300)}`);
  }

  const html = await response.text();
  const rows = html.match(/<tr\b[^>]*\bmk="\d{8}-\d{3}"[\s\S]*?<\/tr>/g) ?? [];
  const matches = rows.flatMap((row): SourceMatch[] => {
    const matchNum = row.match(/\bmk="\d{8}-(\d{3})"/)?.[1];
    const competitionName = decodeHtml(row.match(/<a[^>]*\bclass="ls"[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? "");
    const kickoffAtText = row.match(/比赛开始时间[：:]\s*([\d-]+\s+\d{2}:\d{2})/)?.[1];
    const homeTeamName = decodeHtml(row.match(/<a[^>]*\bclass="home"[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? "");
    const awayTeamName = decodeHtml(row.match(/<a[^>]*\bclass="guest"[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? "");

    if (!matchNum || !competitionName || !kickoffAtText || !homeTeamName || !awayTeamName) {
      return [];
    }

    const kickoffAt = normalizeKickoffAt(`${kickoffAtText.replace(" ", "T")}:00+08:00`);
    if (!kickoffAt) {
      return [];
    }

    return [
      {
        competitionName,
        homeTeamName,
        awayTeamName,
        kickoffAt,
        status: "SCHEDULED",
        venue: `中国体彩竞彩足球 ${matchNum}`,
        sourceUrl,
      },
    ];
  });

  if (matches.length === 0) {
    throw new Error("CPBao match source returned no matches.");
  }

  return matches;
}

async function hasDuplicateMatch(match: SourceMatch) {
  const kickoffAt = new Date(match.kickoffAt);
  const existing = await prisma.match.findMany({
    where: {
      kickoffAt,
      competition: { name: match.competitionName },
      source: "china_sports_lottery",
    },
    include: { homeTeam: true, awayTeam: true },
  });

  return existing.some(
    (item) =>
      normalizeTeamName(item.homeTeam.name) === normalizeTeamName(match.homeTeamName) &&
      normalizeTeamName(item.awayTeam.name) === normalizeTeamName(match.awayTeamName),
  );
}

function normalizeTeamName(value: string) {
  return value
    .replace(/北马其顿/g, "马其顿")
    .replace(/乌兹别克斯坦/g, "乌兹别克")
    .replace(/\s+/g, "")
    .trim();
}

export async function runMatchSourceSync(actor: AppUser) {
  const settings = await getMatchSourceSettings();
  const window = getChinaLotterySalesDayWindow();

  if (!settings.syncEnabled) {
    return { imported: 0, skipped: 0, message: "赛事自动同步未启用" };
  }

  if (settings.provider === "manual") {
    return { imported: 0, skipped: 0, message: "当前数据来源为手动录入" };
  }

  const fetchedMatches =
    settings.provider === "api"
      ? await fetchExternalMatches(settings.apiUrl)
      : await fetchSportteryMatches().catch(async (error) => {
          console.error("Sporttery source failed, falling back to CPBao source", error);
          return fetchCpbaoMatches().catch(async (fallbackError) => {
            console.error("CPBao source failed, falling back to OpenAI search", fallbackError);
            return fetchOpenAiSearchMatchesForSalesWindow();
          });
        });
  const matches = fetchedMatches.filter((match) => {
    const kickoffAt = new Date(match.kickoffAt);
    return kickoffAt >= window.start && kickoffAt <= window.end;
  });

  let imported = 0;
  let skipped = 0;

  for (const match of matches.slice(0, 50)) {
    if (match.homeTeamName === match.awayTeamName || (await hasDuplicateMatch(match))) {
      skipped += 1;
      continue;
    }

    await createAdminMatch({
      competitionName: match.competitionName,
      homeTeamName: match.homeTeamName,
      awayTeamName: match.awayTeamName,
      kickoffAt: new Date(match.kickoffAt),
      status: match.status,
      venue: match.venue || match.sourceUrl,
      homeScore: match.homeScore ?? null,
      awayScore: match.awayScore ?? null,
      source: "china_sports_lottery",
      actor,
    });
    imported += 1;
  }

  return {
    imported,
    skipped,
    provider: settings.provider,
    fetched: fetchedMatches.length,
    inWindow: matches.length,
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
  };
}
