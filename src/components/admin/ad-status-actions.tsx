"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdStatusActionsProps = {
  campaignId: string;
};

type StatusResponse = {
  ok: boolean;
  error?: {
    message: string;
  };
};

export function AdStatusActions({ campaignId }: AdStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [message, setMessage] = useState("");

  async function updateStatus(status: "APPROVED" | "REJECTED") {
    setLoading(status);
    setMessage("");

    const response = await fetch(`/api/admin/ads/${campaignId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        rejectReason: status === "REJECTED" ? "广告素材不符合审核底线" : undefined,
      }),
    });
    const result = (await response.json()) as StatusResponse;
    setLoading(null);

    if (!result.ok) {
      setMessage(result.error?.message ?? "操作失败，请稍后再试");
      return;
    }

    setMessage(status === "APPROVED" ? "已通过" : "已拒绝");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          aria-label="通过广告"
          className="rounded-lg border border-[#36d37e]/30 px-3 py-1.5 text-xs text-[#b8ffd5] disabled:opacity-50"
          data-testid={`ad-approve-${campaignId}`}
          disabled={loading !== null}
          onClick={() => updateStatus("APPROVED")}
          type="button"
        >
          {loading === "APPROVED" ? "处理中" : "通过"}
        </button>
        <button
          aria-label="拒绝广告"
          className="rounded-lg border border-[#ff6675]/30 px-3 py-1.5 text-xs text-[#ffc2c8] disabled:opacity-50"
          data-testid={`ad-reject-${campaignId}`}
          disabled={loading !== null}
          onClick={() => updateStatus("REJECTED")}
          type="button"
        >
          {loading === "REJECTED" ? "处理中" : "拒绝"}
        </button>
      </div>
      {message ? <p className="text-xs text-[#f6c85f]">{message}</p> : null}
    </div>
  );
}
