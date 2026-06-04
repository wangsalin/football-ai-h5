"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, WandSparkles } from "lucide-react";

const sampleInput = {
  match: {
    competition: "德甲",
    kickoffAt: "2026-05-29T19:30:00+08:00",
    homeTeam: "帕德博恩",
    awayTeam: "沃尔夫斯堡",
    venue: "主队主场",
  },
  basic: {
    homeRank: 8,
    awayRank: 12,
    homeRecentForm: "胜平负胜平",
    awayRecentForm: "负平胜负平",
    motivationSummary: "主队争取更高排名，客队保级压力较小",
  },
  lineup: {
    homeInjuries: ["主力中卫疑似缺阵"],
    awayInjuries: ["主力前锋停赛"],
    scheduleImpact: "双方无欧战，体能影响较小",
  },
  odds: {
    europeanInitial: { home: 2.1, draw: 3.3, away: 3.2 },
    europeanCurrent: { home: 1.95, draw: 3.35, away: 3.6 },
    asianInitial: "主让0.25",
    asianCurrent: "主让0.5",
    goalLineInitial: "2.5",
    goalLineCurrent: "2.25",
  },
};

type MatchOption = {
  id: string;
  title: string;
};

type Draft = {
  summary: string;
  winDrawLossPick: string;
  handicapPick?: string;
  scorePicks: string[];
  totalGoalsPick?: string;
  halfFullPick?: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  coldAlertReason?: string;
  sections?: Array<{
    sectionKey: string;
    title: string;
    content: string;
  }>;
};

type DraftResponse = {
  ok: boolean;
  data?: {
    draft: Draft;
    provider: string;
  };
  error?: {
    message: string;
  };
};

type GenerateDraftButtonProps = {
  matches: MatchOption[];
};

export function GenerateDraftButton({ matches }: GenerateDraftButtonProps) {
  const router = useRouter();
  const [matchId, setMatchId] = useState(matches[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<DraftResponse["data"]>();

  async function generateDraft() {
    setLoading(true);
    setMessage("");
    setDraft(undefined);

    const response = await fetch("/api/admin/predictions/generate-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sampleInput),
    });
    const result = (await response.json()) as DraftResponse;
    setLoading(false);

    if (!result.ok) {
      setMessage(result.error?.message || "生成失败，请稍后再试");
      return;
    }

    setDraft(result.data);
    setMessage("已生成草稿，可人工确认后保存到预测列表。");
  }

  async function saveDraft() {
    if (!draft?.draft || !matchId) {
      return;
    }

    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        summary: draft.draft.summary,
        winDrawLossPick: draft.draft.winDrawLossPick,
        handicapPick: draft.draft.handicapPick,
        scorePicks: draft.draft.scorePicks,
        totalGoalsPick: draft.draft.totalGoalsPick,
        halfFullPick: draft.draft.halfFullPick,
        riskLevel: draft.draft.riskLevel,
        confidence: draft.draft.confidence,
        coldAlertReason: draft.draft.coldAlertReason,
        sections: draft.draft.sections,
        status: "DRAFT",
      }),
    });
    const result = (await response.json()) as DraftResponse;
    setSaving(false);

    if (!result.ok) {
      setMessage(result.error?.message || "保存失败，请确认该赛事还没有预测");
      return;
    }

    setMessage("AI 草稿已保存为预测草稿");
    router.refresh();
  }

  return (
    <div>
      <label className="mb-3 block text-sm text-[#c7d7ca]">
        保存到赛事
        <select
          className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
          data-testid="draft-match-select"
          value={matchId}
          onChange={(event) => setMatchId(event.target.value)}
        >
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.title}
            </option>
          ))}
        </select>
      </label>

      <button
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#36d37e] px-3 text-sm font-semibold text-[#07110d] disabled:opacity-60"
        disabled={loading}
        onClick={generateDraft}
        type="button"
      >
        <WandSparkles size={16} aria-hidden="true" />
        {loading ? "生成中" : "AI 生成草稿"}
      </button>

      {message ? <p className="mt-3 text-xs leading-5 text-[#f6c85f]">{message}</p> : null}

      {draft ? (
        <div className="mt-3 rounded-xl bg-[#132d21] p-3 text-sm">
          <p className="font-semibold text-[#eef7ef]">{draft.draft.summary}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-[#9db4a5]">风险</dt>
              <dd className="mt-1 text-[#f6c85f]">{draft.draft.riskLevel}</dd>
            </div>
            <div>
              <dt className="text-[#9db4a5]">信心</dt>
              <dd className="mt-1 text-[#f6c85f]">{draft.draft.confidence}/10</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[#9db4a5]">比分</dt>
              <dd className="mt-1 text-[#f6c85f]">{draft.draft.scorePicks.join(" / ")}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[#9db4a5]">分析维度</dt>
              <dd className="mt-1 text-[#f6c85f]">{draft.draft.sections?.length ?? 0} 段</dd>
            </div>
          </dl>
          <button
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#f6c85f]/30 text-xs font-semibold text-[#f6c85f] disabled:opacity-50"
            data-testid="draft-save-submit"
            disabled={saving || !matchId}
            onClick={saveDraft}
            type="button"
          >
            <Save size={15} aria-hidden="true" />
            {saving ? "保存中" : "保存为预测草稿"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
