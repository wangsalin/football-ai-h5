"use client";

import { Bell, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MatchPreferenceActionsProps = {
  matchId: string;
  isAuthenticated: boolean;
  initialFavorite: boolean;
  initialReminder: boolean;
};

type ApiResult = {
  ok: boolean;
  error?: {
    message: string;
  };
};

type PreferenceKind = "favorite" | "reminder";

const endpointByKind: Record<PreferenceKind, string> = {
  favorite: "/api/me/favorites",
  reminder: "/api/me/reminders",
};

export function MatchPreferenceActions({
  matchId,
  isAuthenticated,
  initialFavorite,
  initialReminder,
}: MatchPreferenceActionsProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [hasReminder, setHasReminder] = useState(initialReminder);
  const [pending, setPending] = useState<PreferenceKind | null>(null);
  const [message, setMessage] = useState("");

  async function updatePreference(kind: PreferenceKind, enabled: boolean) {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/matches/${matchId}`);
      return;
    }

    setPending(kind);
    setMessage("");

    const response = await fetch(endpointByKind[kind], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, enabled }),
    });
    const result = (await response.json()) as ApiResult;
    setPending(null);

    if (!result.ok) {
      setMessage(result.error?.message ?? "操作失败，请稍后重试");
      return;
    }

    if (kind === "favorite") {
      setIsFavorite(enabled);
      setMessage(enabled ? "已收藏比赛" : "已取消收藏");
    } else {
      setHasReminder(enabled);
      setMessage(enabled ? "已设置开赛前 30 分钟提醒" : "已取消提醒");
    }

    router.refresh();
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6c85f] disabled:opacity-60 ${
            isFavorite
              ? "border-[#f6c85f]/40 bg-[#f6c85f]/15 text-[#ffe2a3]"
              : "border-white/10 bg-[#0e1f17] text-[#eef7ef]"
          }`}
          data-testid="favorite-toggle"
          disabled={pending !== null}
          onClick={() => updatePreference("favorite", !isFavorite)}
          type="button"
        >
          <Bookmark size={16} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
          {pending === "favorite" ? "处理中" : isFavorite ? "已收藏" : "收藏比赛"}
        </button>
        <button
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6c85f] disabled:opacity-60 ${
            hasReminder ? "bg-[#f6c85f] text-[#07110d]" : "bg-[#36d37e] text-[#07110d]"
          }`}
          data-testid="reminder-toggle"
          disabled={pending !== null}
          onClick={() => updatePreference("reminder", !hasReminder)}
          type="button"
        >
          <Bell size={16} fill={hasReminder ? "currentColor" : "none"} aria-hidden="true" />
          {pending === "reminder" ? "处理中" : hasReminder ? "已提醒" : "开赛提醒"}
        </button>
      </div>
      {message ? (
        <p className="mt-2 rounded-xl border border-white/8 bg-[#07110d] px-3 py-2 text-xs text-[#b8ffd5]" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
