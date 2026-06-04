"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type MatchOption = {
  id: string;
  title: string;
};

type PredictionItem = {
  id: string;
  matchId: string;
  matchTitle: string;
  summary: string;
  winDrawLossPick: string;
  handicapPick: string;
  scorePicks: string[];
  totalGoalsPick: string;
  halfFullPick: string;
  riskLevel: string;
  confidence: number;
  coldAlertReason: string;
  status: string;
};

type PredictionEditorProps = {
  matches: MatchOption[];
  predictions: PredictionItem[];
};

type ApiResult = {
  ok: boolean;
  error?: {
    message: string;
  };
};

type PredictionFormState = {
  matchId: string;
  summary: string;
  winDrawLossPick: string;
  handicapPick: string;
  scorePicksText: string;
  totalGoalsPick: string;
  halfFullPick: string;
  riskLevel: string;
  confidence: string;
  coldAlertReason: string;
  status: string;
};

function initialForm(matchId = ""): PredictionFormState {
  return {
    matchId,
    summary: "",
    winDrawLossPick: "",
    handicapPick: "",
    scorePicksText: "1-0,1-1,2-1",
    totalGoalsPick: "",
    halfFullPick: "",
    riskLevel: "MEDIUM" as const,
    confidence: "6",
    coldAlertReason: "",
    status: "DRAFT" as const,
  };
}

export function PredictionEditor({ matches, predictions }: PredictionEditorProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm(matches[0]?.id ?? ""));
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(name: keyof PredictionFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(initialForm(matches[0]?.id ?? ""));
    setMessage("");
  }

  function startEdit(prediction: PredictionItem) {
    setEditingId(prediction.id);
    setForm({
      matchId: prediction.matchId,
      summary: prediction.summary,
      winDrawLossPick: prediction.winDrawLossPick,
      handicapPick: prediction.handicapPick,
      scorePicksText: prediction.scorePicks.join(","),
      totalGoalsPick: prediction.totalGoalsPick,
      halfFullPick: prediction.halfFullPick,
      riskLevel: prediction.riskLevel,
      confidence: String(prediction.confidence),
      coldAlertReason: prediction.coldAlertReason,
      status: prediction.status,
    });
    setMessage("");
  }

  async function submit() {
    setSubmitting(true);
    setMessage("");

    const payload = {
      matchId: form.matchId,
      summary: form.summary,
      winDrawLossPick: form.winDrawLossPick,
      handicapPick: form.handicapPick || undefined,
      scorePicks: form.scorePicksText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      totalGoalsPick: form.totalGoalsPick || undefined,
      halfFullPick: form.halfFullPick || undefined,
      riskLevel: form.riskLevel,
      confidence: Number(form.confidence),
      coldAlertReason: form.coldAlertReason || undefined,
      status: form.status,
    };

    const response = await fetch(editingId ? `/api/admin/predictions/${editingId}` : "/api/admin/predictions", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as ApiResult;
    setSubmitting(false);

    if (!result.ok) {
      setMessage(result.error?.message ?? "保存失败，请检查预测信息");
      return;
    }

    setMessage(editingId ? "预测已更新" : "预测已创建");
    if (!editingId) {
      setForm(initialForm(matches[0]?.id ?? ""));
    }
    router.refresh();
  }

  return (
    <div className="mb-4 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#eef7ef]">{editingId ? "编辑预测" : "新建预测"}</h2>
          <p className="mt-1 text-xs text-[#9db4a5]">保存结构化预测内容，并记录 AuditLog。</p>
        </div>
        <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-[#f6c85f]" onClick={startCreate} type="button">
          新建模式
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-[#c7d7ca]">
          赛事
          <select className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.matchId} onChange={(event) => updateField("matchId", event.target.value)}>
            {matches.map((match) => (
              <option key={match.id} value={match.id}>
                {match.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[#c7d7ca]">
          状态
          <select className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
            <option value="DRAFT">DRAFT</option>
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="OFFLINE">OFFLINE</option>
          </select>
        </label>
        <label className="md:col-span-2 text-sm text-[#c7d7ca]">
          摘要
          <textarea className="mt-1 min-h-20 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 py-2 text-[#eef7ef]" value={form.summary} onChange={(event) => updateField("summary", event.target.value)} />
        </label>
        <label className="text-sm text-[#c7d7ca]">
          胜平负
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.winDrawLossPick} onChange={(event) => updateField("winDrawLossPick", event.target.value)} />
        </label>
        <label className="text-sm text-[#c7d7ca]">
          比分建议
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.scorePicksText} onChange={(event) => updateField("scorePicksText", event.target.value)} />
        </label>
        <label className="text-sm text-[#c7d7ca]">
          风险
          <select className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.riskLevel} onChange={(event) => updateField("riskLevel", event.target.value)}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </label>
        <label className="text-sm text-[#c7d7ca]">
          信心
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" inputMode="decimal" value={form.confidence} onChange={(event) => updateField("confidence", event.target.value.replace(/[^\d.]/g, ""))} />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#36d37e] px-4 text-sm font-semibold text-[#07110d] disabled:opacity-50"
          data-testid={editingId ? "prediction-update-submit" : "prediction-create-submit"}
          disabled={submitting || !form.matchId || !form.summary || !form.winDrawLossPick}
          onClick={submit}
          type="button"
        >
          {submitting ? "保存中" : editingId ? "保存编辑" : "创建预测"}
        </button>
        {message ? <p className="text-sm text-[#f6c85f]">{message}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {predictions.slice(0, 6).map((prediction) => (
          <button
            key={prediction.id}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#c7d7ca]"
            data-testid={`prediction-edit-${prediction.id}`}
            onClick={() => startEdit(prediction)}
            type="button"
          >
            编辑 {prediction.matchTitle}
          </button>
        ))}
      </div>
    </div>
  );
}
