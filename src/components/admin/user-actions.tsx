"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type UserActionsProps = {
  userId: string;
  phone: string;
  nickname: string;
  role: string;
  status: string;
};

type ApiResult = {
  ok: boolean;
  error?: { message: string };
};

export function UserActions({ userId, phone, nickname, role, status }: UserActionsProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(role);
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [editedPhone, setEditedPhone] = useState(phone);
  const [editedNickname, setEditedNickname] = useState(nickname === "-" ? "" : nickname);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setMessage("");

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: editedPhone,
        nickname: editedNickname,
        role: selectedRole,
        status: selectedStatus,
      }),
    });
    const result = (await response.json()) as ApiResult;
    setSubmitting(false);

    if (!result.ok) {
      setMessage(result.error?.message ?? "用户更新失败");
      return;
    }

    setMessage("已更新");
    router.refresh();
  }

  return (
    <details className="min-w-[260px] rounded-xl border border-white/8 bg-[#07110d] p-2">
      <summary className="cursor-pointer text-xs font-semibold text-[#f6c85f]">查看 / 编辑</summary>
      <div className="mt-3 grid gap-2">
        <label className="text-xs text-[#9db4a5]">
          手机号
          <input
            className="mt-1 min-h-9 w-full rounded-lg border border-white/10 bg-[#0e1f17] px-2 text-xs text-[#eef7ef]"
            data-testid={`user-phone-${userId}`}
            maxLength={11}
            value={editedPhone}
            onChange={(event) => setEditedPhone(event.target.value.replace(/\D/g, "").slice(0, 11))}
          />
        </label>
        <label className="text-xs text-[#9db4a5]">
          昵称
          <input
            className="mt-1 min-h-9 w-full rounded-lg border border-white/10 bg-[#0e1f17] px-2 text-xs text-[#eef7ef]"
            data-testid={`user-nickname-${userId}`}
            value={editedNickname}
            onChange={(event) => setEditedNickname(event.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-[#9db4a5]">
            角色
            <select
              className="mt-1 min-h-9 w-full rounded-lg border border-white/10 bg-[#0e1f17] px-2 text-xs text-[#eef7ef]"
              data-testid={`user-role-${userId}`}
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
            >
              <option value="USER">USER</option>
              <option value="ADVERTISER">ADVERTISER</option>
              <option value="ANALYST">ANALYST</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </label>
          <label className="text-xs text-[#9db4a5]">
            状态
            <select
              className="mt-1 min-h-9 w-full rounded-lg border border-white/10 bg-[#0e1f17] px-2 text-xs text-[#eef7ef]"
              data-testid={`user-status-${userId}`}
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </label>
        </div>
        <button
          className="min-h-9 rounded-lg border border-white/10 px-3 text-xs font-semibold text-[#f6c85f] disabled:opacity-50"
          data-testid={`user-update-${userId}`}
          disabled={submitting}
          onClick={submit}
          type="button"
        >
          {submitting ? "保存中" : "保存用户资料"}
        </button>
        {message ? <p className="text-xs text-[#f6c85f]">{message}</p> : null}
      </div>
    </details>
  );
}
