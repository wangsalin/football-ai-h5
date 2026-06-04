"use client";

import { useState } from "react";

type AdminAccount = {
  id: string;
  username: string;
  phone: string;
  rawPhone: string;
  nickname: string;
  role: "ANALYST" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "DISABLED";
  passwordSet: boolean;
  lastLoginAt: string;
};

type Props = {
  accounts: AdminAccount[];
};

type FormState = {
  id?: string;
  username: string;
  nickname: string;
  phone: string;
  password: string;
  role: "ANALYST" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "DISABLED";
};

type ApiResult = {
  ok: boolean;
  error?: { message: string };
};

const emptyForm: FormState = {
  username: "",
  nickname: "",
  phone: "",
  password: "",
  role: "ADMIN",
  status: "ACTIVE",
};

export function AdminAccountsEditor({ accounts }: Props) {
  const [rows, setRows] = useState(accounts);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const editing = Boolean(form.id);

  function editAccount(account: AdminAccount) {
    setMessage("");
    setForm({
      id: account.id,
      username: account.username,
      nickname: account.nickname === "-" ? "" : account.nickname,
      phone: account.rawPhone,
      password: "",
      role: account.role,
      status: account.status,
    });
  }

  async function submit() {
    setSubmitting(true);
    setMessage("");

    const response = await fetch(editing ? `/api/admin/admin-accounts/${form.id}` : "/api/admin/admin-accounts", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = (await response.json()) as ApiResult & { data?: { account: AdminAccount } };
    setSubmitting(false);

    if (!result.ok || !result.data?.account) {
      setMessage(result.error?.message ?? "管理员账号保存失败");
      return;
    }

    const saved = result.data.account;
    setRows((current) => (editing ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved]));
    setForm(emptyForm);
    setMessage(editing ? "管理员账号已更新" : "管理员账号已创建");
  }

  return (
    <section className="rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-[#eef7ef]">管理员账号</h2>
        <button
          className="min-h-9 rounded-xl border border-white/10 px-3 text-sm text-[#c7d7ca] hover:bg-[#132d21]"
          onClick={() => {
            setForm(emptyForm);
            setMessage("");
          }}
          type="button"
        >
          新建账号
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-white/8">
        <table className="min-w-full divide-y divide-white/8 text-left text-sm">
          <thead className="bg-[#07110d] text-[#9db4a5]">
            <tr>
              {["账号", "名称", "角色", "状态", "密码", "最近登录", "操作"].map((header) => (
                <th className="whitespace-nowrap px-3 py-3 font-medium" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {rows.map((account) => (
              <tr key={account.id}>
                <td className="whitespace-nowrap px-3 py-3 text-[#eef7ef]">{account.username || "-"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-[#c7d7ca]">{account.nickname}</td>
                <td className="whitespace-nowrap px-3 py-3 text-[#c7d7ca]">{account.role}</td>
                <td className="whitespace-nowrap px-3 py-3 text-[#c7d7ca]">{account.status}</td>
                <td className="whitespace-nowrap px-3 py-3 text-[#c7d7ca]">{account.passwordSet ? "已设置" : "未设置"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-[#c7d7ca]">{account.lastLoginAt}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  <button className="text-[#36d37e] hover:underline" onClick={() => editAccount(account)} type="button">
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm text-[#c7d7ca]">
          登录账号
          <input
            className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
          />
        </label>

        <label className="text-sm text-[#c7d7ca]">
          显示名称
          <input
            className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
            value={form.nickname}
            onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))}
          />
        </label>

        <label className="text-sm text-[#c7d7ca]">
          手机号
          <input
            className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          />
        </label>

        <label className="text-sm text-[#c7d7ca]">
          角色
          <select
            className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as FormState["role"] }))}
          >
            <option value="ANALYST">分析师</option>
            <option value="ADMIN">管理员</option>
            <option value="SUPER_ADMIN">超级管理员</option>
          </select>
        </label>

        <label className="text-sm text-[#c7d7ca]">
          状态
          <select
            className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as FormState["status"] }))}
          >
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">禁用</option>
          </select>
        </label>

        <label className="text-sm text-[#c7d7ca]">
          {editing ? "重置密码" : "登录密码"}
          <input
            autoComplete="new-password"
            className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]"
            placeholder={editing ? "留空则不修改" : "至少 8 位"}
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </label>

        <div className="flex items-center gap-3 md:col-span-3">
          <button
            className="min-h-10 rounded-xl bg-[#36d37e] px-4 text-sm font-semibold text-[#07110d] disabled:opacity-50"
            disabled={submitting}
            onClick={submit}
            type="button"
          >
            {submitting ? "保存中" : editing ? "保存账号" : "创建账号"}
          </button>
          {message ? <p className="text-sm text-[#f6c85f]">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}
