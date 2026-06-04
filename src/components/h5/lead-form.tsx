"use client";

import { useState } from "react";
import { Phone } from "lucide-react";

type LeadPayload = {
  companyName: string;
  contactName: string;
  phone: string;
  city: string;
  message: string;
};

const initialPayload: LeadPayload = {
  companyName: "",
  contactName: "",
  phone: "",
  city: "",
  message: "",
};

export function LeadForm() {
  const [payload, setPayload] = useState(initialPayload);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(key: keyof LeadPayload, value: string) {
    setPayload((current) => ({ ...current, [key]: value }));
  }

  async function submitLead() {
    setMessage("");
    setSubmitting(true);

    const response = await fetch("/api/ads/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setSubmitting(false);

    if (!result.ok) {
      setMessage(result.error?.message || "提交失败，请稍后再试");
      return;
    }

    setPayload(initialPayload);
    setMessage("已提交合作意向，我们会尽快联系你。");
  }

  return (
    <form className="mt-4 space-y-3">
      {[
        ["companyName", "品牌名", "例如：城南精酿"],
        ["contactName", "联系人", "请输入联系人"],
        ["phone", "手机号", "请输入手机号"],
        ["city", "城市", "例如：上海"],
      ].map(([id, label, placeholder]) => (
        <div key={id}>
          <label className="mb-1.5 block text-sm text-[#c7d7ca]" htmlFor={id}>
            {label}
          </label>
          <input
            id={id}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-sm text-[#eef7ef] outline-none placeholder:text-[#6f8376] focus:border-[#f6c85f]/60"
            onChange={(event) => updateField(id as keyof LeadPayload, event.target.value)}
            placeholder={placeholder}
            type={id === "phone" ? "tel" : "text"}
            value={payload[id as keyof LeadPayload]}
          />
        </div>
      ))}
      <div>
        <label className="mb-1.5 block text-sm text-[#c7d7ca]" htmlFor="message">
          投放需求
        </label>
        <textarea
          id="message"
          className="min-h-24 w-full resize-none rounded-xl border border-white/10 bg-[#07110d] px-3 py-3 text-sm text-[#eef7ef] outline-none placeholder:text-[#6f8376] focus:border-[#f6c85f]/60"
          onChange={(event) => updateField("message", event.target.value)}
          placeholder="想投放的城市、时间和预算"
          value={payload.message}
        />
      </div>
      {message ? (
        <p className="rounded-xl border border-[#f6c85f]/20 bg-[#f6c85f]/10 px-3 py-2 text-sm leading-5 text-[#f6c85f]">
          {message}
        </p>
      ) : null}
      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#36d37e] text-sm font-semibold text-[#07110d] disabled:opacity-60"
        disabled={submitting}
        onClick={submitLead}
        type="button"
      >
        <Phone size={17} aria-hidden="true" />
        {submitting ? "提交中" : "提交合作意向"}
      </button>
    </form>
  );
}
