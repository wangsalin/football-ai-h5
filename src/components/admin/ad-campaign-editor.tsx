"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: string; label: string };
type SlotOption = Option & { code?: string };
type AdItem = {
  id: string;
  accountId: string;
  slotId: string;
  title: string;
  description: string;
  targetUrl: string;
  priority: number;
  status: string;
  startInput: string;
  endInput: string;
  creativeTitle: string;
  creativeBody: string;
  imageUrl: string;
};

type AdCampaignEditorProps = {
  accounts: Option[];
  slots: SlotOption[];
  campaigns: AdItem[];
};

type FormState = {
  accountId: string;
  slotId: string;
  title: string;
  description: string;
  targetUrl: string;
  priority: string;
  status: string;
  startAt: string;
  endAt: string;
  creativeTitle: string;
  creativeBody: string;
  imageUrl: string;
};

type ApiResult = {
  ok: boolean;
  error?: { message: string };
};

type UploadResult = ApiResult & {
  data?: {
    url: string;
  };
};

function initialForm(accountId = "", slotId = ""): FormState {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    accountId,
    slotId,
    title: "首页轮播 Banner",
    description: "",
    targetUrl: "https://example.com",
    priority: "5",
    status: "PENDING_REVIEW",
    startAt: now.toISOString().slice(0, 16),
    endAt: nextWeek.toISOString().slice(0, 16),
    creativeTitle: "观赛夜套餐",
    creativeBody: "本地看球消费广告，已标记广告。",
    imageUrl: "/uploads/mock-ad.svg",
  };
}

function getDefaultSlotId(slots: SlotOption[]) {
  return slots.find((slot) => slot.code === "HOME_TOP")?.id ?? slots[0]?.id ?? "";
}

export function AdCampaignEditor({ accounts, slots, campaigns }: AdCampaignEditorProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm(accounts[0]?.id ?? "", getDefaultSlotId(slots)));
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const selectedSlot = slots.find((slot) => slot.id === form.slotId);
  const isHomeBanner = selectedSlot?.code === "HOME_TOP";
  const canSubmit = Boolean(
    form.accountId &&
      form.slotId &&
      form.title.trim() &&
      form.creativeTitle.trim() &&
      (!isHomeBanner || form.imageUrl.trim()),
  );

  function updateField(name: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(initialForm(accounts[0]?.id ?? "", getDefaultSlotId(slots)));
    setMessage("");
  }

  function startEdit(campaign: AdItem) {
    setEditingId(campaign.id);
    setForm({
      accountId: campaign.accountId,
      slotId: campaign.slotId,
      title: campaign.title,
      description: campaign.description,
      targetUrl: campaign.targetUrl,
      priority: String(campaign.priority),
      status: campaign.status,
      startAt: campaign.startInput,
      endAt: campaign.endInput,
      creativeTitle: campaign.creativeTitle,
      creativeBody: campaign.creativeBody,
      imageUrl: campaign.imageUrl,
    });
    setMessage("");
  }

  async function submit() {
    setSubmitting(true);
    setMessage("");

    const response = await fetch(editingId ? `/api/admin/ads/${editingId}` : "/api/admin/ads", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        priority: Number(form.priority),
      }),
    });
    const result = (await response.json()) as ApiResult;
    setSubmitting(false);

    if (!result.ok) {
      setMessage(result.error?.message ?? "广告计划保存失败");
      return;
    }

    setMessage(editingId ? "广告计划已更新" : "广告计划已创建");
    if (!editingId) {
      setForm(initialForm(accounts[0]?.id ?? "", getDefaultSlotId(slots)));
    }
    router.refresh();
  }

  async function uploadBanner(file: File | undefined) {
    if (!file) {
      return;
    }

    setUploading(true);
    setMessage("");

    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/admin/uploads/ad-banner", {
      method: "POST",
      body,
    });
    const result = (await response.json()) as UploadResult;
    setUploading(false);

    if (!result.ok || !result.data?.url) {
      setMessage(result.error?.message ?? "Banner 图片上传失败");
      return;
    }

    updateField("imageUrl", result.data.url);
    setMessage("Banner 图片已上传");
  }

  return (
    <div className="mb-4 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#eef7ef]">{editingId ? "编辑广告计划" : "新建广告计划"}</h2>
          <p className="mt-1 text-xs text-[#9db4a5]">首页广告按轮播 Banner 展示；推荐图片比例 2.65:1，移动端会裁切为横幅。</p>
        </div>
        <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-[#f6c85f]" onClick={startCreate} type="button">
          新建模式
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-[#c7d7ca]">
          广告主
          <select className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.accountId} onChange={(event) => updateField("accountId", event.target.value)}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[#c7d7ca]">
          广告位
          <select className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.slotId} onChange={(event) => updateField("slotId", event.target.value)}>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs leading-5 text-[#9db4a5]">
            {isHomeBanner ? "将显示在用户端首页顶部轮播 Banner，支持多条广告自动轮播。" : "该广告位不是首页轮播，请按对应页面位置投放。"}
          </span>
        </label>
        <label className="text-sm text-[#c7d7ca]">
          计划名称
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.title} onChange={(event) => updateField("title", event.target.value)} />
        </label>
        <label className="text-sm text-[#c7d7ca]">
          Banner 主标题
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" maxLength={16} value={form.creativeTitle} onChange={(event) => updateField("creativeTitle", event.target.value)} />
          <span className="mt-1 block text-xs text-[#9db4a5]">建议 4-12 个字，用户端只显示一行。</span>
        </label>
        <label className="text-sm text-[#c7d7ca]">
          开始时间
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" type="datetime-local" value={form.startAt} onChange={(event) => updateField("startAt", event.target.value)} />
        </label>
        <label className="text-sm text-[#c7d7ca]">
          结束时间
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" type="datetime-local" value={form.endAt} onChange={(event) => updateField("endAt", event.target.value)} />
        </label>
        <label className="text-sm text-[#c7d7ca]">
          状态
          <select className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="PAUSED">PAUSED</option>
          </select>
        </label>
        <label className="text-sm text-[#c7d7ca]">
          优先级
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" inputMode="numeric" value={form.priority} onChange={(event) => updateField("priority", event.target.value.replace(/\D/g, ""))} />
        </label>
        <label className="md:col-span-2 text-sm text-[#c7d7ca]">
          计划备注
          <textarea className="mt-1 min-h-20 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 py-2 text-[#eef7ef]" value={form.description} onChange={(event) => updateField("description", event.target.value)} />
        </label>
        <label className="md:col-span-2 text-sm text-[#c7d7ca]">
          Banner 副标题
          <textarea className="mt-1 min-h-20 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 py-2 text-[#eef7ef]" maxLength={42} value={form.creativeBody} onChange={(event) => updateField("creativeBody", event.target.value)} />
          <span className="mt-1 block text-xs text-[#9db4a5]">建议 12-28 个字，最多显示两行，避免把联系方式写进图层文字。</span>
        </label>
        <label className="text-sm text-[#c7d7ca]">
          跳转链接
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.targetUrl} onChange={(event) => updateField("targetUrl", event.target.value)} />
        </label>
        <label className="text-sm text-[#c7d7ca]">
          Banner 图片地址
          <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={form.imageUrl} onChange={(event) => updateField("imageUrl", event.target.value)} />
          <span className="mt-1 block text-xs leading-5 text-[#9db4a5]">推荐 1060x400 或 1325x500，格式 JPG/PNG/WebP/SVG。首页轮播必须填写。</span>
        </label>
        <label className="md:col-span-2 text-sm text-[#c7d7ca]">
          上传 Banner 图片
          <div className="mt-1 flex flex-col gap-2 rounded-xl border border-dashed border-[#f6c85f]/30 bg-[#07110d] p-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#eef7ef]">{uploading ? "正在上传..." : "选择本地图片上传后会自动填入图片地址"}</p>
              <p className="mt-1 text-xs leading-5 text-[#9db4a5]">最大 4MB，建议先按 Banner 横图比例裁好再上传。</p>
            </div>
            <input
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="text-sm text-[#c7d7ca] file:mr-3 file:min-h-9 file:rounded-full file:border-0 file:bg-[#f6c85f] file:px-4 file:text-xs file:font-semibold file:text-[#07110d]"
              disabled={uploading}
              onChange={(event) => void uploadBanner(event.target.files?.[0])}
              type="file"
            />
          </div>
        </label>
      </div>

      <section className="mt-4 rounded-2xl border border-[#f6c85f]/20 bg-[#07110d] p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#eef7ef]">用户端 Banner 预览</h3>
            <p className="mt-1 text-xs text-[#9db4a5]">按首页轮播样式预览，实际图片会以 cover 方式填充横幅。</p>
          </div>
          <span className="rounded-full border border-[#f6c85f]/35 px-2 py-1 text-xs text-[#f6c85f]">{selectedSlot?.label ?? "未选择广告位"}</span>
        </div>
        <div className="relative min-h-[158px] overflow-hidden rounded-2xl border border-[#f6c85f]/25 bg-[#173b2a]">
          {form.imageUrl.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="absolute inset-0 h-full w-full object-cover" src={form.imageUrl} />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_20%,rgba(246,200,95,.22),transparent_28%),linear-gradient(135deg,#173b2a,#0e1f17_58%,#26391f)]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,13,.9),rgba(7,17,13,.58)_58%,rgba(7,17,13,.22))]" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(0deg,rgba(7,17,13,.72),transparent)]" />
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 pr-2">
                <p className="truncate text-[11px] font-medium leading-4 text-[#b9c9bd]">{accounts.find((account) => account.id === form.accountId)?.label ?? "广告主"}</p>
                <p className="mt-1 line-clamp-1 text-lg font-semibold leading-6 text-[#fff5cf]">{form.creativeTitle || "Banner 主标题"}</p>
              </div>
              <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-[#f6c85f]/45 bg-[#07110d]/70 px-2 text-[11px] leading-none text-[#f6c85f]">广告</span>
            </div>
            <div>
              <p className="line-clamp-2 max-w-[88%] text-sm leading-5 text-[#e5eee7]">{form.creativeBody || "Banner 副标题将显示在这里。"}</p>
              <div className="mt-2 flex min-h-9 items-end justify-between gap-3">
                <p className="min-w-0 truncate pb-1 text-[11px] leading-4 text-[#9db4a5]">{selectedSlot?.label ?? "首页顶部"}</p>
                <span className="inline-flex min-h-9 shrink-0 items-center rounded-full bg-[#f6c85f] px-4 text-xs font-semibold text-[#07110d]">查看详情</span>
              </div>
            </div>
          </div>
        </div>
        {isHomeBanner && !form.imageUrl.trim() ? <p className="mt-2 text-xs text-[#ffcf75]">首页轮播 Banner 需要填写图片地址后再保存。</p> : null}
      </section>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#36d37e] px-4 text-sm font-semibold text-[#07110d] disabled:opacity-50"
          data-testid={editingId ? "ad-update-submit" : "ad-create-submit"}
          disabled={submitting || !canSubmit}
          onClick={submit}
          type="button"
        >
          {submitting ? "保存中" : editingId ? "保存编辑" : "创建计划"}
        </button>
        {message ? <p className="text-sm text-[#f6c85f]">{message}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {campaigns.slice(0, 6).map((campaign) => (
          <button key={campaign.id} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#c7d7ca]" data-testid={`ad-edit-${campaign.id}`} onClick={() => startEdit(campaign)} type="button">
            编辑 {campaign.title}
          </button>
        ))}
      </div>
    </div>
  );
}
