"use client";

import { useState } from "react";
import type { AutomationSettings } from "@/services/admin-settings";

type Props = { settings: AutomationSettings };
type ApiResult = { ok: boolean; data?: { result?: { created: number; updated?: number; skipped: number; message?: string } }; error?: { message: string } };

export function AutomationSettingsEditor({ settings }: Props) {
  const [form, setForm] = useState(settings);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function save() {
    setSubmitting("save");
    setMessage("");
    const response = await fetch("/api/admin/settings/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = (await response.json()) as ApiResult;
    setSubmitting(null);
    setMessage(result.ok ? "自动任务设置已保存" : (result.error?.message ?? "保存失败"));
  }

  async function run(kind: "auto-predictions" | "prematch-reanalysis" | "auto-reviews") {
    setSubmitting(kind);
    setMessage("");
    const response = await fetch(`/api/admin/jobs/${kind}`, { method: "POST" });
    const result = (await response.json()) as ApiResult;
    setSubmitting(null);
    setMessage(
      result.ok
        ? `${kind === "auto-predictions" ? "自动预测" : kind === "prematch-reanalysis" ? "赛前再分析" : "自动复盘"}完成：新增 ${result.data?.result?.created ?? 0}，更新 ${result.data?.result?.updated ?? 0}，跳过 ${result.data?.result?.skipped ?? 0}${result.data?.result?.message ? `，${result.data.result.message}` : ""}`
        : (result.error?.message ?? "运行失败"),
    );
  }

  return (
    <section className="mt-4 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
      <h2 className="text-lg font-semibold text-[#eef7ef]">自动预测 / 自动复盘</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="grid gap-3">
          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#07110d] px-3 text-sm text-[#c7d7ca]">
            <input checked={form.predictionEnabled} onChange={(e) => setForm((v) => ({ ...v, predictionEnabled: e.target.checked }))} type="checkbox" />
            启用自动预测
          </label>
          <label className="text-sm text-[#c7d7ca]">
            每天运行时间
            <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" type="time" value={form.predictionRunAt} onChange={(e) => setForm((v) => ({ ...v, predictionRunAt: e.target.value }))} />
          </label>
          <label className="text-sm text-[#c7d7ca]">
            提前生成范围（小时）
            <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" type="number" value={form.predictionLookaheadHours} onChange={(e) => setForm((v) => ({ ...v, predictionLookaheadHours: Number(e.target.value) }))} />
          </label>
          <label className="text-sm text-[#c7d7ca]">
            生成后状态
            <select className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.predictionStatus} onChange={(e) => setForm((v) => ({ ...v, predictionStatus: e.target.value as AutomationSettings["predictionStatus"] }))}>
              <option value="DRAFT">草稿</option>
              <option value="PENDING_REVIEW">待审核</option>
              <option value="PUBLISHED">自动发布</option>
            </select>
          </label>
          <button className="min-h-10 rounded-xl border border-[#f6c85f]/30 px-4 text-sm font-semibold text-[#f6c85f]" disabled={submitting !== null} onClick={() => run("auto-predictions")} type="button">
            立即运行自动预测
          </button>
        </div>

        <div className="grid gap-3">
          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#07110d] px-3 text-sm text-[#c7d7ca]">
            <input checked={form.prematchReanalysisEnabled} onChange={(e) => setForm((v) => ({ ...v, prematchReanalysisEnabled: e.target.checked }))} type="checkbox" />
            启用赛前再次分析
          </label>
          <label className="text-sm text-[#c7d7ca]">
            开赛前多少分钟
            <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" type="number" value={form.prematchReanalysisMinutesBefore} onChange={(e) => setForm((v) => ({ ...v, prematchReanalysisMinutesBefore: Number(e.target.value) }))} />
          </label>
          <label className="text-sm text-[#c7d7ca]">
            检查窗口（分钟）
            <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" type="number" value={form.prematchReanalysisWindowMinutes} onChange={(e) => setForm((v) => ({ ...v, prematchReanalysisWindowMinutes: Number(e.target.value) }))} />
          </label>
          <label className="text-sm text-[#c7d7ca]">
            再分析后状态
            <select className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.prematchReanalysisStatus} onChange={(e) => setForm((v) => ({ ...v, prematchReanalysisStatus: e.target.value as AutomationSettings["prematchReanalysisStatus"] }))}>
              <option value="DRAFT">草稿</option>
              <option value="PENDING_REVIEW">待审核</option>
              <option value="PUBLISHED">自动发布</option>
            </select>
          </label>
          <button className="min-h-10 rounded-xl border border-[#f6c85f]/30 px-4 text-sm font-semibold text-[#f6c85f]" disabled={submitting !== null} onClick={() => run("prematch-reanalysis")} type="button">
            立即检查赛前再分析
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-[#07110d] p-4 text-xs leading-5 text-[#9db4a5]">
          赛前再次分析会按“开赛前分钟数 ± 检查窗口”查找比赛。已处理过的同一场比赛不会重复处理。
        </div>

        <div className="grid gap-3">
          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#07110d] px-3 text-sm text-[#c7d7ca]">
            <input checked={form.reviewEnabled} onChange={(e) => setForm((v) => ({ ...v, reviewEnabled: e.target.checked }))} type="checkbox" />
            启用自动复盘
          </label>
          <label className="text-sm text-[#c7d7ca]">
            每天运行时间
            <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" type="time" value={form.reviewRunAt} onChange={(e) => setForm((v) => ({ ...v, reviewRunAt: e.target.value }))} />
          </label>
          <label className="text-sm text-[#c7d7ca]">
            赛后延迟（小时）
            <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" type="number" value={form.reviewDelayHours} onChange={(e) => setForm((v) => ({ ...v, reviewDelayHours: Number(e.target.value) }))} />
          </label>
          <label className="text-sm text-[#c7d7ca]">
            生成后状态
            <select className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.reviewStatus} onChange={(e) => setForm((v) => ({ ...v, reviewStatus: e.target.value as AutomationSettings["reviewStatus"] }))}>
              <option value="DRAFT">草稿</option>
              <option value="PENDING_REVIEW">待审核</option>
              <option value="PUBLISHED">自动发布</option>
            </select>
          </label>
          <button className="min-h-10 rounded-xl border border-[#f6c85f]/30 px-4 text-sm font-semibold text-[#f6c85f]" disabled={submitting !== null} onClick={() => run("auto-reviews")} type="button">
            立即运行自动复盘
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="min-h-10 rounded-xl bg-[#36d37e] px-4 text-sm font-semibold text-[#07110d] disabled:opacity-50" disabled={submitting !== null} onClick={save} type="button">
          {submitting === "save" ? "保存中" : "保存自动任务设置"}
        </button>
        {message ? <p className="text-sm text-[#f6c85f]">{message}</p> : null}
      </div>
      <p className="mt-3 text-xs leading-5 text-[#9db4a5]">部署后让服务器 cron 调用 `/api/admin/jobs/auto-predictions`、`/api/admin/jobs/prematch-reanalysis` 和 `/api/admin/jobs/auto-reviews`。本地可用上面的立即运行按钮验证。</p>
    </section>
  );
}
