"use client";

import { useState } from "react";
import type { SiteSettings } from "@/services/admin-settings";

type Props = {
  settings: SiteSettings;
};

type ApiResult = {
  ok: boolean;
  error?: { message: string };
};

export function SiteSettingsEditor({ settings }: Props) {
  const [form, setForm] = useState(settings);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setMessage("");

    const response = await fetch("/api/admin/settings/site", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = (await response.json()) as ApiResult;
    setSubmitting(false);
    setMessage(result.ok ? "站点设置已保存" : (result.error?.message ?? "站点设置保存失败"));
  }

  return (
    <section className="rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
      <h2 className="text-lg font-semibold text-[#eef7ef]">站点信息</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm text-[#c7d7ca]">
          网站名称
          <input
            className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
            value={form.siteName}
            onChange={(event) => setForm((current) => ({ ...current, siteName: event.target.value }))}
          />
        </label>

        <label className="text-sm text-[#c7d7ca]">
          主域名
          <input
            className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
            placeholder="example.com"
            value={form.siteDomain}
            onChange={(event) => setForm((current) => ({ ...current, siteDomain: event.target.value }))}
          />
        </label>

        <label className="text-sm text-[#c7d7ca]">
          用户端访问地址
          <input
            className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
            placeholder="https://example.com"
            value={form.publicBaseUrl}
            onChange={(event) => setForm((current) => ({ ...current, publicBaseUrl: event.target.value }))}
          />
        </label>

        <label className="text-sm text-[#c7d7ca]">
          管理端路径
          <input
            className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
            placeholder="/admin"
            value={form.adminBasePath}
            onChange={(event) => setForm((current) => ({ ...current, adminBasePath: event.target.value }))}
          />
        </label>

        <div className="flex items-center gap-3 md:col-span-2">
          <button
            className="min-h-10 rounded-xl bg-[#36d37e] px-4 text-sm font-semibold text-[#07110d] disabled:opacity-50"
            disabled={submitting}
            onClick={submit}
            type="button"
          >
            {submitting ? "保存中" : "保存站点设置"}
          </button>
          {message ? <p className="text-sm text-[#f6c85f]">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}
