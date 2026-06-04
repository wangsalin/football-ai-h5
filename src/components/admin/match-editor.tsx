"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type MatchFormItem = {
  id: string;
  competitionName: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffInput: string;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
  source: "manual" | "china_sports_lottery";
};

type MatchStatusValue = "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";

type MatchFormState = {
  competitionName: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffInput: string;
  status: MatchStatusValue;
  venue: string;
  homeScore: string;
  awayScore: string;
  source: "manual" | "china_sports_lottery";
};

type MatchEditorProps = {
  matches: MatchFormItem[];
};

type ApiResult = {
  ok: boolean;
  error?: {
    message: string;
  };
};

const emptyForm: MatchFormState = {
  competitionName: "友谊赛",
  homeTeamName: "",
  awayTeamName: "",
  kickoffInput: "",
  status: "SCHEDULED",
  venue: "",
  homeScore: "",
  awayScore: "",
  source: "china_sports_lottery",
};

export function MatchEditor({ matches }: MatchEditorProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const editingMatch = useMemo(() => matches.find((match) => match.id === editingId), [editingId, matches]);

  function updateField(name: keyof MatchFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  }

  function startEdit(match: MatchFormItem) {
    setEditingId(match.id);
    setForm({
      competitionName: match.competitionName,
      homeTeamName: match.homeTeamName,
      awayTeamName: match.awayTeamName,
      kickoffInput: match.kickoffInput,
      status: match.status,
      venue: match.venue,
      homeScore: match.homeScore === null ? "" : String(match.homeScore),
      awayScore: match.awayScore === null ? "" : String(match.awayScore),
      source: match.source,
    });
    setMessage("");
  }

  async function submit() {
    setSubmitting(true);
    setMessage("");

    const payload = {
      competitionName: form.competitionName,
      homeTeamName: form.homeTeamName,
      awayTeamName: form.awayTeamName,
      kickoffAt: new Date(form.kickoffInput).toISOString(),
      status: form.status,
      venue: form.venue || undefined,
      homeScore: form.homeScore === "" ? null : Number(form.homeScore),
      awayScore: form.awayScore === "" ? null : Number(form.awayScore),
      source: form.source,
    };

    const response = await fetch(editingId ? `/api/admin/matches/${editingId}` : "/api/admin/matches", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as ApiResult;
    setSubmitting(false);

    if (!result.ok) {
      setMessage(result.error?.message ?? "保存失败，请检查赛事信息");
      return;
    }

    setMessage(editingId ? "赛事已更新" : "赛事已创建");
    if (!editingId) {
      setForm(emptyForm);
    }
    router.refresh();
  }

  return (
    <div className="mb-4 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#eef7ef]">{editingMatch ? "编辑赛事" : "新增赛事"}</h2>
          <p className="mt-1 text-xs text-[#9db4a5]">保存后写入 Prisma，并记录 AuditLog。</p>
        </div>
        <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-[#f6c85f]" onClick={startCreate} type="button">
          新增模式
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm text-[#c7d7ca]">
          联赛
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.competitionName} onChange={(event) => updateField("competitionName", event.target.value)} />
        </label>
        <label className="text-sm text-[#c7d7ca]">
          主队
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.homeTeamName} onChange={(event) => updateField("homeTeamName", event.target.value)} />
        </label>
        <label className="text-sm text-[#c7d7ca]">
          客队
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.awayTeamName} onChange={(event) => updateField("awayTeamName", event.target.value)} />
        </label>
        <label className="text-sm text-[#c7d7ca]">
          开赛时间
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" type="datetime-local" value={form.kickoffInput} onChange={(event) => updateField("kickoffInput", event.target.value)} />
        </label>
        <label className="text-sm text-[#c7d7ca]">
          状态
          <select className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="LIVE">LIVE</option>
            <option value="FINISHED">FINISHED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>
        <label className="text-sm text-[#c7d7ca]">
          场地
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.venue} onChange={(event) => updateField("venue", event.target.value)} />
        </label>
        <label className="text-sm text-[#c7d7ca]">
          主队比分
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" inputMode="numeric" value={form.homeScore} onChange={(event) => updateField("homeScore", event.target.value.replace(/\D/g, ""))} />
        </label>
        <label className="text-sm text-[#c7d7ca]">
          客队比分
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" inputMode="numeric" value={form.awayScore} onChange={(event) => updateField("awayScore", event.target.value.replace(/\D/g, ""))} />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#36d37e] px-4 text-sm font-semibold text-[#07110d] disabled:opacity-50"
          data-testid={editingId ? "match-update-submit" : "match-create-submit"}
          disabled={submitting || !form.homeTeamName || !form.awayTeamName || !form.kickoffInput}
          onClick={submit}
          type="button"
        >
          {submitting ? "保存中" : editingId ? "保存编辑" : "创建赛事"}
        </button>
        {message ? <p className="text-sm text-[#f6c85f]">{message}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {matches.slice(0, 6).map((match) => (
          <button
            key={match.id}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#c7d7ca]"
            data-testid={`match-edit-${match.id}`}
            onClick={() => startEdit(match)}
            type="button"
          >
            编辑 {match.homeTeamName}
          </button>
        ))}
      </div>
    </div>
  );
}
