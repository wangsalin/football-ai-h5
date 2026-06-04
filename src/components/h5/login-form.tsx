"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, MessageCircle, Phone } from "lucide-react";

type ApiResult<T> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: { code: string; message: string } };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => searchParams.get("redirect") || "/me", [searchParams]);
  const isAdminLogin = redirectTo.startsWith("/admin");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);

  async function sendCode() {
    setMessage("");

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setMessage("请输入正确的手机号");
      return;
    }

    setSending(true);
    const response = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const result = (await response.json()) as ApiResult<{ code?: string }>;
    setSending(false);

    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }

    setMessage("验证码已发送，请查看手机短信");
  }

  async function loginByPhone() {
    setMessage("");

    if (!agreed) {
      setMessage("请先同意用户协议和隐私政策");
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setMessage("请输入正确的手机号");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setMessage("请输入 6 位验证码");
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const result = (await response.json()) as ApiResult<{ user: { nickname: string } }>;
    setSubmitting(false);

    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function loginByPassword() {
    setMessage("");

    if (!username.trim()) {
      setMessage("请输入管理账号");
      return;
    }
    if (!password) {
      setMessage("请输入密码");
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/auth/password-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const result = (await response.json()) as ApiResult<{ user: { nickname: string } }>;
    setSubmitting(false);

    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <section className="mt-6 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
      {isAdminLogin ? (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-[#c7d7ca]" htmlFor="username">
              管理账号
            </label>
            <input
              id="username"
              autoComplete="username"
              className="min-h-12 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-base text-[#eef7ef] outline-none placeholder:text-[#6f8376] focus:border-[#f6c85f]/60"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="请输入管理账号"
              type="text"
              value={username}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-[#c7d7ca]" htmlFor="password">
              密码
            </label>
            <input
              id="password"
              autoComplete="current-password"
              className="min-h-12 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-base text-[#eef7ef] outline-none placeholder:text-[#6f8376] focus:border-[#f6c85f]/60"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
              type="password"
              value={password}
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
            onClick={loginByPassword}
            type="button"
          >
            <KeyRound size={17} aria-hidden="true" />
            {submitting ? "登录中" : "登录管理端"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-[#c7d7ca]" htmlFor="phone">
              手机号
            </label>
            <input
              id="phone"
              className="min-h-12 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-base text-[#eef7ef] outline-none placeholder:text-[#6f8376] focus:border-[#f6c85f]/60"
              inputMode="tel"
              maxLength={11}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="请输入手机号"
              type="tel"
              value={phone}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-[#c7d7ca]" htmlFor="code">
              验证码
            </label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                id="code"
                autoComplete="one-time-code"
                className="min-h-12 min-w-0 rounded-xl border border-white/10 bg-[#07110d] px-3 text-base text-[#eef7ef] outline-none placeholder:text-[#6f8376] focus:border-[#f6c85f]/60"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 位数字"
                type="text"
                value={code}
              />
              <button
                className="min-h-12 rounded-xl border border-[#f6c85f]/30 px-3 text-sm font-semibold text-[#f6c85f] disabled:opacity-50"
                disabled={sending}
                onClick={sendCode}
                type="button"
              >
                {sending ? "发送中" : "获取验证码"}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs leading-5 text-[#9db4a5]">
            <input
              checked={agreed}
              className="mt-1 accent-[#36d37e]"
              onChange={(event) => setAgreed(event.target.checked)}
              type="checkbox"
            />
            <span>我已阅读并同意用户协议和隐私政策，理解赛事内容仅供数据分析参考。</span>
          </label>

          {message ? (
            <p className="rounded-xl border border-[#f6c85f]/20 bg-[#f6c85f]/10 px-3 py-2 text-sm leading-5 text-[#f6c85f]">
              {message}
            </p>
          ) : null}

          <button
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#36d37e] text-sm font-semibold text-[#07110d] disabled:opacity-60"
            disabled={submitting}
            onClick={loginByPhone}
            type="button"
          >
            <Phone size={17} aria-hidden="true" />
            {submitting ? "登录中" : "登录 / 注册"}
          </button>

          <button
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-semibold text-[#c7d7ca]"
            type="button"
          >
            <MessageCircle size={17} aria-hidden="true" />
            微信登录待接入
          </button>
        </div>
      )}
    </section>
  );
}
