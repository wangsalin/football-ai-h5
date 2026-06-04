"use client";

import { useState } from "react";
import type { AiSettings, MatchSourceSettings } from "@/services/admin-settings";

type SystemSettingsEditorProps = {
  aiSettings: AiSettings;
  matchSourceSettings: MatchSourceSettings;
};

type ApiResult = {
  ok: boolean;
  error?: { message: string };
};

export function SystemSettingsEditor({ aiSettings, matchSourceSettings }: SystemSettingsEditorProps) {
  const [aiForm, setAiForm] = useState(aiSettings);
  const [sourceForm, setSourceForm] = useState(matchSourceSettings);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function saveAiSettings() {
    setSubmitting("ai");
    setMessage("");

    const response = await fetch("/api/admin/settings/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aiForm),
    });
    const result = (await response.json()) as ApiResult;
    setSubmitting(null);

    setMessage(result.ok ? "模型、API 和 Prompt 设置已保存" : (result.error?.message ?? "模型设置保存失败"));
    if (result.ok) {
      setAiForm((current) => ({ ...current, apiKey: "", apiKeySet: current.apiKeySet || Boolean(current.apiKey) }));
    }
  }

  async function saveMatchSourceSettings() {
    setSubmitting("source");
    setMessage("");

    const response = await fetch("/api/admin/settings/match-source", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sourceForm),
    });
    const result = (await response.json()) as ApiResult;
    setSubmitting(null);

    setMessage(result.ok ? "赛事数据源设置已保存" : (result.error?.message ?? "赛事数据源保存失败"));
  }

  async function runMatchSync() {
    setSubmitting("sync");
    setMessage("");

    const response = await fetch("/api/admin/jobs/sync-matches", { method: "POST" });
    const result = (await response.json()) as ApiResult & {
      data?: { result?: { imported?: number; skipped?: number; message?: string } };
    };
    setSubmitting(null);

    if (!result.ok) {
      setMessage(result.error?.message ?? "赛事同步失败");
      return;
    }

    const syncResult = result.data?.result;
    setMessage(
      syncResult?.message ?? `赛事同步完成：新增 ${syncResult?.imported ?? 0} 场，跳过 ${syncResult?.skipped ?? 0} 场`,
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
        <h2 className="text-lg font-semibold text-[#eef7ef]">模型、API 与 Prompt</h2>
        <div className="mt-4 grid gap-3">
          <label className="text-sm text-[#c7d7ca]">
            模型服务
            <select
              className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
              value={aiForm.provider}
              onChange={(event) =>
                setAiForm((current) => ({
                  ...current,
                  provider: event.target.value as AiSettings["provider"],
                  model: event.target.value === "openai" && current.model.startsWith("mock-") ? "gpt-5.5" : current.model,
                }))
              }
            >
              <option value="mock">本地模拟</option>
              <option value="openai">OpenAI API</option>
            </select>
          </label>

          <label className="text-sm text-[#c7d7ca]">
            API 地址
            <input
              className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
              placeholder="https://api.openai.com/v1"
              value={aiForm.apiBaseUrl}
              onChange={(event) => setAiForm((current) => ({ ...current, apiBaseUrl: event.target.value }))}
            />
          </label>

          <label className="text-sm text-[#c7d7ca]">
            API Key{aiForm.apiKeySet ? "（已保存，留空则不变）" : ""}
            <input
              autoComplete="off"
              className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
              placeholder={aiForm.apiKeySet ? "已保存密钥，输入新值可替换" : "输入模型 API Key"}
              type="password"
              value={aiForm.apiKey}
              onChange={(event) => setAiForm((current) => ({ ...current, apiKey: event.target.value }))}
            />
          </label>

          <label className="text-sm text-[#c7d7ca]">
            模型名
            <input
              className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
              placeholder="gpt-5.5"
              value={aiForm.model}
              onChange={(event) => setAiForm((current) => ({ ...current, model: event.target.value }))}
            />
          </label>

          <label className="text-sm text-[#c7d7ca]">
            Temperature
            <input
              className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
              inputMode="decimal"
              value={String(aiForm.temperature)}
              onChange={(event) => setAiForm((current) => ({ ...current, temperature: Number(event.target.value) }))}
            />
          </label>

          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#07110d] px-3 text-sm text-[#c7d7ca]">
            <input
              checked={aiForm.webSearchEnabled}
              onChange={(event) => setAiForm((current) => ({ ...current, webSearchEnabled: event.target.checked }))}
              type="checkbox"
            />
            AI 草稿允许调用 OpenAI web_search
          </label>

          <label className="text-sm text-[#c7d7ca]">
            System Prompt
            <textarea
              className="mt-1 min-h-32 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 py-2 text-[#eef7ef]"
              value={aiForm.systemPrompt}
              onChange={(event) => setAiForm((current) => ({ ...current, systemPrompt: event.target.value }))}
            />
          </label>

          <label className="text-sm text-[#c7d7ca]">
            User Prompt 模板
            <textarea
              className="mt-1 min-h-32 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 py-2 text-[#eef7ef]"
              value={aiForm.userPromptTemplate}
              onChange={(event) => setAiForm((current) => ({ ...current, userPromptTemplate: event.target.value }))}
            />
          </label>

          <p className="rounded-xl bg-[#132d21] px-3 py-3 text-xs leading-5 text-[#9db4a5]">
            OpenAI 联网检索需要使用 Responses API 并启用 web_search 工具。官方模型列表当前没有 GPT-5.5；建议先配置
            gpt-5.2 或实际账号可用的模型。
          </p>

          <button
            className="min-h-10 rounded-xl bg-[#36d37e] px-4 text-sm font-semibold text-[#07110d] disabled:opacity-50"
            data-testid="save-ai-settings"
            disabled={submitting === "ai"}
            onClick={saveAiSettings}
            type="button"
          >
            {submitting === "ai" ? "保存中" : "保存模型设置"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
        <h2 className="text-lg font-semibold text-[#eef7ef]">赛事数据源</h2>
        <div className="mt-4 grid gap-3">
          <label className="text-sm text-[#c7d7ca]">
            数据来源
            <select
              className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
              value={sourceForm.provider}
              onChange={(event) =>
                setSourceForm((current) => ({ ...current, provider: event.target.value as MatchSourceSettings["provider"] }))
              }
            >
              <option value="manual">手动录入 / 批量导入</option>
              <option value="api">外部赛事 API</option>
              <option value="openai_search">OpenAI 联网检索</option>
            </select>
          </label>

          <label className="text-sm text-[#c7d7ca]">
            外部 API 地址
            <input
              className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
              placeholder="https://example.com/matches"
              value={sourceForm.apiUrl}
              onChange={(event) => setSourceForm((current) => ({ ...current, apiUrl: event.target.value }))}
            />
          </label>

          <label className="text-sm text-[#c7d7ca]">
            联网检索模型
            <input
              className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
              placeholder="gpt-5.5"
              value={sourceForm.searchModel}
              onChange={(event) => setSourceForm((current) => ({ ...current, searchModel: event.target.value }))}
            />
          </label>

          <label className="text-sm text-[#c7d7ca]">
            赛事检索 Prompt
            <textarea
              className="mt-1 min-h-32 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 py-2 text-[#eef7ef]"
              value={sourceForm.searchPromptTemplate}
              onChange={(event) => setSourceForm((current) => ({ ...current, searchPromptTemplate: event.target.value }))}
            />
          </label>

          <label className="text-sm text-[#c7d7ca]">
            同步计划
            <input
              className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
              value={sourceForm.syncCron}
              onChange={(event) => setSourceForm((current) => ({ ...current, syncCron: event.target.value }))}
            />
          </label>

          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#07110d] px-3 text-sm text-[#c7d7ca]">
            <input
              checked={sourceForm.syncEnabled}
              onChange={(event) => setSourceForm((current) => ({ ...current, syncEnabled: event.target.checked }))}
              type="checkbox"
            />
            启用自动同步
          </label>

          <p className="rounded-xl bg-[#132d21] px-3 py-3 text-xs leading-5 text-[#9db4a5]">
            赛事数据建议优先接稳定赛事 API。OpenAI 联网检索适合作为补充校验或低频导入，结果需要来源和时间核验，不能替代数据库级的赛程供应商。
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="min-h-10 rounded-xl bg-[#36d37e] px-4 text-sm font-semibold text-[#07110d] disabled:opacity-50"
              data-testid="save-match-source-settings"
              disabled={submitting === "source"}
              onClick={saveMatchSourceSettings}
              type="button"
            >
              {submitting === "source" ? "保存中" : "保存数据源设置"}
            </button>
            <button
              className="min-h-10 rounded-xl border border-white/10 px-4 text-sm font-semibold text-[#c7d7ca] hover:bg-[#132d21] disabled:opacity-50"
              disabled={submitting === "sync"}
              onClick={runMatchSync}
              type="button"
            >
              {submitting === "sync" ? "同步中" : "立即同步赛事"}
            </button>
          </div>
        </div>
      </section>

      {message ? <p className="rounded-xl border border-white/8 bg-[#07110d] px-3 py-2 text-sm text-[#f6c85f] lg:col-span-2">{message}</p> : null}
    </div>
  );
}
