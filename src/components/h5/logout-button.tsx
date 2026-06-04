"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function logout() {
    setSubmitting(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0e1f17] text-sm font-semibold text-[#eef7ef] disabled:opacity-60"
      disabled={submitting}
      onClick={logout}
      type="button"
    >
      <LogOut size={16} aria-hidden="true" />
      {submitting ? "退出中" : "退出登录"}
    </button>
  );
}
