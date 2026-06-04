"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const sampleJson = JSON.stringify(
  [
    {
      competitionName: "英超",
      homeTeamName: "导入主队",
      awayTeamName: "导入客队",
      kickoffAt: "2026-06-05T12:00:00.000Z",
      status: "SCHEDULED",
      venue: "导入球场",
      homeScore: null,
      awayScore: null,
    },
  ],
  null,
  2,
);

type ApiResult = {
  ok: boolean;
  data?: { count: number };
  error?: { message: string };
};

export function MatchImporter() {
  const router = useRouter();
  const [rawJson, setRawJson] = useState(sampleJson);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setMessage("");

    let matches: unknown;
    try {
      matches = JSON.parse(rawJson);
    } catch {
      setSubmitting(false);
      setMessage("JSON 格式不正确");
      return;
    }

    const response = await fetch("/api/admin/matches/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matches }),
    });
    const result = (await response.json()) as ApiResult;
    setSubmitting(false);

    if (!result.ok) {
      setMessage(result.error?.message ?? "导入失败，请检查字段");
      return;
    }

    setMessage(`已导入 ${result.data?.count ?? 0} 场赛事`);
    router.refresh();
  }

  return (
    <div className="mb-4 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-[#eef7ef]">批量导入赛事</h2>
        <p className="mt-1 text-xs text-[#9db4a5]">支持粘贴 JSON 数组，一次导入多场赛事，并写入 AuditLog。</p>
      </div>
      <textarea
        className="min-h-52 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 py-2 font-mono text-xs text-[#eef7ef]"
        data-testid="match-import-json"
        value={rawJson}
        onChange={(event) => setRawJson(event.target.value)}
      />
      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
        <button
          className="min-h-10 rounded-xl bg-[#36d37e] px-4 text-sm font-semibold text-[#07110d] disabled:opacity-50"
          data-testid="match-import-submit"
          disabled={submitting}
          onClick={submit}
          type="button"
        >
          {submitting ? "导入中" : "导入赛事"}
        </button>
        {message ? <p className="text-sm text-[#f6c85f]">{message}</p> : null}
      </div>
    </div>
  );
}
