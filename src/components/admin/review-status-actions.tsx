"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ReviewStatusActionsProps = {
  reviewId: string;
  status: string;
};

type StatusResponse = {
  ok: boolean;
  error?: {
    message: string;
  };
};

export function ReviewStatusActions({ reviewId, status }: ReviewStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const nextStatus = status === "PUBLISHED" ? "OFFLINE" : "PUBLISHED";
  const actionLabel = nextStatus === "PUBLISHED" ? "发布" : "下架";

  async function updateStatus() {
    setLoading(true);
    setMessage("");

    const response = await fetch(`/api/admin/reviews/${reviewId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const result = (await response.json()) as StatusResponse;
    setLoading(false);

    if (!result.ok) {
      setMessage(result.error?.message ?? "操作失败，请稍后再试");
      return;
    }

    setMessage(nextStatus === "PUBLISHED" ? "已发布" : "已下架");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#f6c85f]" type="button">
          编辑
        </button>
        <button
          aria-label={`${actionLabel}复盘`}
          className="rounded-lg border border-[#36d37e]/30 px-3 py-1.5 text-xs text-[#b8ffd5] disabled:opacity-50"
          data-testid={`review-status-${reviewId}`}
          disabled={loading}
          onClick={updateStatus}
          type="button"
        >
          {loading ? "处理中" : actionLabel}
        </button>
      </div>
      {message ? <p className="text-xs text-[#f6c85f]">{message}</p> : null}
    </div>
  );
}
