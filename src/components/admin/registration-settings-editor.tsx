"use client";

import { useState } from "react";
import type { RegistrationSettings } from "@/services/admin-settings";

type RegistrationSettingsEditorProps = {
  settings: RegistrationSettings;
};

type ApiResult = {
  ok: boolean;
  error?: { message: string };
};

export function RegistrationSettingsEditor({ settings }: RegistrationSettingsEditorProps) {
  const [form, setForm] = useState(settings);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setMessage("");

    const response = await fetch("/api/admin/settings/registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = (await response.json()) as ApiResult;
    setSubmitting(false);

    setMessage(result.ok ? "注册设置已保存" : (result.error?.message ?? "注册设置保存失败"));
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_180px]">
      <label className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#07110d] px-3 text-sm text-[#c7d7ca]">
        <input
          checked={form.enabled}
          onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
          type="checkbox"
        />
        开放手机号新用户注册
      </label>

      <label className="text-sm text-[#c7d7ca]">
        默认角色
        <select
          className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
          value={form.defaultRole}
          onChange={(event) => setForm((current) => ({ ...current, defaultRole: event.target.value as "USER" | "ADVERTISER" }))}
        >
          <option value="USER">普通用户</option>
          <option value="ADVERTISER">广告主</option>
        </select>
      </label>

      <label className="text-sm text-[#c7d7ca] md:col-span-2">
        关闭注册提示语
        <input
          className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
          value={form.disabledMessage}
          onChange={(event) => setForm((current) => ({ ...current, disabledMessage: event.target.value }))}
        />
      </label>

      <div className="flex items-center gap-3 md:col-span-2">
        <button
          className="min-h-10 rounded-xl bg-[#36d37e] px-4 text-sm font-semibold text-[#07110d] disabled:opacity-50"
          disabled={submitting}
          onClick={submit}
          type="button"
        >
          {submitting ? "保存中" : "保存注册设置"}
        </button>
        {message ? <p className="text-sm text-[#f6c85f]">{message}</p> : null}
      </div>
    </div>
  );
}
