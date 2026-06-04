"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type MatchOption = {
  id: string;
  title: string;
};

type PredictionOption = {
  id: string;
  matchId: string;
  matchTitle: string;
  summary: string;
};

type ReviewItem = {
  id: string;
  matchId: string;
  predictionId: string;
  teams: string;
  actualResult: string;
  resultType: string;
  hitSummary: string;
  missReason: string;
  correctionNote: string;
  status: string;
};

type ReviewEditorProps = {
  matches: MatchOption[];
  predictions: PredictionOption[];
  reviews: ReviewItem[];
};

type ApiResult = {
  ok: boolean;
  error?: {
    message: string;
  };
};

type ReviewFormState = {
  matchId: string;
  predictionId: string;
  actualResult: string;
  resultType: string;
  hitSummary: string;
  missReason: string;
  correctionNote: string;
  status: string;
};

function initialForm(matchId = "", predictionId = ""): ReviewFormState {
  return {
    matchId,
    predictionId,
    actualResult: "",
    resultType: "HIT",
    hitSummary: "",
    missReason: "",
    correctionNote: "",
    status: "DRAFT",
  };
}

export function ReviewEditor({ matches, predictions, reviews }: ReviewEditorProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm(matches[0]?.id ?? "", predictions[0]?.id ?? ""));
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredPredictions = predictions.filter((prediction) => prediction.matchId === form.matchId);

  function updateField(name: keyof ReviewFormState, value: string) {
    setForm((current) => {
      if (name === "matchId") {
        const nextPrediction = predictions.find((prediction) => prediction.matchId === value);
        return { ...current, matchId: value, predictionId: nextPrediction?.id ?? "" };
      }

      return { ...current, [name]: value };
    });
  }

  function startCreate() {
    setEditingId(null);
    setForm(initialForm(matches[0]?.id ?? "", predictions[0]?.id ?? ""));
    setMessage("");
  }

  function startEdit(review: ReviewItem) {
    setEditingId(review.id);
    setForm({
      matchId: review.matchId,
      predictionId: review.predictionId,
      actualResult: review.actualResult,
      resultType: review.resultType,
      hitSummary: review.hitSummary,
      missReason: review.missReason === "无" ? "" : review.missReason,
      correctionNote: review.correctionNote,
      status: review.status,
    });
    setMessage("");
  }

  async function submit() {
    setSubmitting(true);
    setMessage("");

    const payload = {
      matchId: form.matchId,
      predictionId: form.predictionId || undefined,
      actualResult: form.actualResult,
      resultType: form.resultType,
      hitSummary: form.hitSummary,
      missReason: form.missReason || undefined,
      correctionNote: form.correctionNote || undefined,
      status: form.status,
    };

    const response = await fetch(editingId ? `/api/admin/reviews/${editingId}` : "/api/admin/reviews", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as ApiResult;
    setSubmitting(false);

    if (!result.ok) {
      setMessage(result.error?.message ?? "保存失败，请检查复盘信息");
      return;
    }

    setMessage(editingId ? "复盘已更新" : "复盘已创建");
    if (!editingId) {
      setForm(initialForm(matches[0]?.id ?? "", predictions[0]?.id ?? ""));
    }
    router.refresh();
  }

  return (
    <div className="mb-4 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#eef7ef]">{editingId ? "编辑复盘" : "新建复盘"}</h2>
          <p className="mt-1 text-xs text-[#9db4a5]">记录赛后偏差、命中情况和修正说明，并写入 AuditLog。</p>
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
          关联预测
          <select className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.predictionId} onChange={(event) => updateField("predictionId", event.target.value)}>
            <option value="">不关联</option>
            {filteredPredictions.map((prediction) => (
              <option key={prediction.id} value={prediction.id}>
                {prediction.matchTitle}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[#c7d7ca]">
          赛果
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.actualResult} onChange={(event) => updateField("actualResult", event.target.value)} />
        </label>
        <label className="text-sm text-[#c7d7ca]">
          结果
          <select className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.resultType} onChange={(event) => updateField("resultType", event.target.value)}>
            <option value="HIT">HIT</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="MISS">MISS</option>
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
        <label className="text-sm text-[#c7d7ca]">
          错因
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.missReason} onChange={(event) => updateField("missReason", event.target.value)} />
        </label>
        <label className="md:col-span-2 text-sm text-[#c7d7ca]">
          命中摘要
          <textarea className="mt-1 min-h-20 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 py-2 text-[#eef7ef]" value={form.hitSummary} onChange={(event) => updateField("hitSummary", event.target.value)} />
        </label>
        <label className="md:col-span-2 text-sm text-[#c7d7ca]">
          修正说明
          <textarea className="mt-1 min-h-20 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 py-2 text-[#eef7ef]" value={form.correctionNote} onChange={(event) => updateField("correctionNote", event.target.value)} />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#36d37e] px-4 text-sm font-semibold text-[#07110d] disabled:opacity-50"
          data-testid={editingId ? "review-update-submit" : "review-create-submit"}
          disabled={submitting || !form.matchId || !form.actualResult || !form.hitSummary}
          onClick={submit}
          type="button"
        >
          {submitting ? "保存中" : editingId ? "保存编辑" : "创建复盘"}
        </button>
        {message ? <p className="text-sm text-[#f6c85f]">{message}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {reviews.slice(0, 6).map((review) => (
          <button
            key={review.id}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#c7d7ca]"
            data-testid={`review-edit-${review.id}`}
            onClick={() => startEdit(review)}
            type="button"
          >
            编辑 {review.teams}
          </button>
        ))}
      </div>
    </div>
  );
}
