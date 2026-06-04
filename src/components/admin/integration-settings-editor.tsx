"use client";

import { useState } from "react";
import type { SmsSettings, WechatSettings } from "@/services/admin-settings";

type Props = {
  smsSettings: SmsSettings;
  wechatSettings: WechatSettings;
};

type ApiResult = {
  ok: boolean;
  error?: { message: string };
};

export function IntegrationSettingsEditor({ smsSettings, wechatSettings }: Props) {
  const [smsForm, setSmsForm] = useState(smsSettings);
  const [wechatForm, setWechatForm] = useState(wechatSettings);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function saveSms() {
    setSubmitting("sms");
    setMessage("");
    const response = await fetch("/api/admin/settings/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(smsForm),
    });
    const result = (await response.json()) as ApiResult;
    setSubmitting(null);
    setMessage(result.ok ? "短信接口设置已保存" : (result.error?.message ?? "短信设置保存失败"));
    if (result.ok) {
      setSmsForm((current) => ({ ...current, appSecret: "", appSecretSet: current.appSecretSet || Boolean(current.appSecret) }));
    }
  }

  async function saveWechat() {
    setSubmitting("wechat");
    setMessage("");
    const response = await fetch("/api/admin/settings/wechat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wechatForm),
    });
    const result = (await response.json()) as ApiResult;
    setSubmitting(null);
    setMessage(result.ok ? "微信接口设置已保存" : (result.error?.message ?? "微信设置保存失败"));
    if (result.ok) {
      setWechatForm((current) => ({
        ...current,
        appSecret: "",
        token: "",
        encodingAesKey: "",
        appSecretSet: current.appSecretSet || Boolean(current.appSecret),
        tokenSet: current.tokenSet || Boolean(current.token),
        encodingAesKeySet: current.encodingAesKeySet || Boolean(current.encodingAesKey),
      }));
    }
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
        <h2 className="text-lg font-semibold text-[#eef7ef]">短信接口设置</h2>
        <div className="mt-4 grid gap-3">
          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#07110d] px-3 text-sm text-[#c7d7ca]">
            <input checked={smsForm.enabled} onChange={(e) => setSmsForm((v) => ({ ...v, enabled: e.target.checked }))} type="checkbox" />
            启用短信发送
          </label>
          <label className="text-sm text-[#c7d7ca]">
            短信服务
            <select className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={smsForm.provider} onChange={(e) => setSmsForm((v) => ({ ...v, provider: e.target.value as SmsSettings["provider"] }))}>
              <option value="mock">本地模拟</option>
              <option value="aliyun">阿里云短信</option>
              <option value="tencent">腾讯云短信</option>
            </select>
          </label>
          <p className="rounded-xl bg-[#132d21] px-3 py-3 text-xs leading-5 text-[#9db4a5]">
            {smsForm.provider === "aliyun"
              ? "阿里云使用 SendSms 接口：AccessKey ID、AccessKey Secret、短信签名和模板 Code。验证码变量固定为 code。"
              : smsForm.provider === "tencent"
                ? "腾讯云使用 SendSms 接口：SecretId、SecretKey、短信 SdkAppId、签名、模板 ID 和地域。验证码作为第一个模板变量。"
                : "本地模拟不会真实发送短信，仅用于开发测试。"}
          </p>
          <label className="text-sm text-[#c7d7ca]">
            {smsForm.provider === "tencent" ? "SecretId" : smsForm.provider === "aliyun" ? "AccessKey ID" : "App Key"}
            <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={smsForm.appKey} onChange={(e) => setSmsForm((v) => ({ ...v, appKey: e.target.value }))} />
          </label>
          <label className="text-sm text-[#c7d7ca]">
            {smsForm.provider === "tencent" ? "SecretKey" : smsForm.provider === "aliyun" ? "AccessKey Secret" : "App Secret"}
            {smsForm.appSecretSet ? "（已保存，留空则不变）" : ""}
            <input autoComplete="off" className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" type="password" value={smsForm.appSecret} onChange={(e) => setSmsForm((v) => ({ ...v, appSecret: e.target.value }))} />
          </label>
          {smsForm.provider === "tencent" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-[#c7d7ca]">
                短信 SdkAppId
                <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={smsForm.sdkAppId} onChange={(e) => setSmsForm((v) => ({ ...v, sdkAppId: e.target.value }))} />
              </label>
              <label className="text-sm text-[#c7d7ca]">
                地域
                <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" placeholder="ap-guangzhou" value={smsForm.region} onChange={(e) => setSmsForm((v) => ({ ...v, region: e.target.value }))} />
              </label>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-[#c7d7ca]">
              签名
              <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={smsForm.signName} onChange={(e) => setSmsForm((v) => ({ ...v, signName: e.target.value }))} />
            </label>
            <label className="text-sm text-[#c7d7ca]">
              {smsForm.provider === "aliyun" ? "模板 Code" : "模板 ID"}
              <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={smsForm.templateId} onChange={(e) => setSmsForm((v) => ({ ...v, templateId: e.target.value }))} />
            </label>
          </div>
          <p className="rounded-xl bg-[#132d21] px-3 py-3 text-xs leading-5 text-[#9db4a5]">
            短信模板需要在云厂商控制台先审核通过。阿里云模板变量请使用 <span className="text-[#eef7ef]">code</span>；腾讯云模板变量第一个位置会传入验证码。
          </p>
          <button className="min-h-10 rounded-xl bg-[#36d37e] px-4 text-sm font-semibold text-[#07110d] disabled:opacity-50" disabled={submitting === "sms"} onClick={saveSms} type="button">
            {submitting === "sms" ? "保存中" : "保存短信设置"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
        <h2 className="text-lg font-semibold text-[#eef7ef]">微信接口设置</h2>
        <div className="mt-4 grid gap-3">
          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#07110d] px-3 text-sm text-[#c7d7ca]">
            <input checked={wechatForm.enabled} onChange={(e) => setWechatForm((v) => ({ ...v, enabled: e.target.checked }))} type="checkbox" />
            启用微信接口
          </label>
          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#07110d] px-3 text-sm text-[#c7d7ca]">
            <input checked={wechatForm.jsSdkEnabled} onChange={(e) => setWechatForm((v) => ({ ...v, jsSdkEnabled: e.target.checked }))} type="checkbox" />
            启用 JS-SDK 分享配置
          </label>
          <label className="text-sm text-[#c7d7ca]">
            App ID
            <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={wechatForm.appId} onChange={(e) => setWechatForm((v) => ({ ...v, appId: e.target.value }))} />
          </label>
          <label className="text-sm text-[#c7d7ca]">
            App Secret{wechatForm.appSecretSet ? "（已保存，留空则不变）" : ""}
            <input autoComplete="off" className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" type="password" value={wechatForm.appSecret} onChange={(e) => setWechatForm((v) => ({ ...v, appSecret: e.target.value }))} />
          </label>
          <label className="text-sm text-[#c7d7ca]">
            Token{wechatForm.tokenSet ? "（已保存，留空则不变）" : ""}
            <input autoComplete="off" className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" type="password" value={wechatForm.token} onChange={(e) => setWechatForm((v) => ({ ...v, token: e.target.value }))} />
          </label>
          <label className="text-sm text-[#c7d7ca]">
            EncodingAESKey{wechatForm.encodingAesKeySet ? "（已保存，留空则不变）" : ""}
            <input autoComplete="off" className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" type="password" value={wechatForm.encodingAesKey} onChange={(e) => setWechatForm((v) => ({ ...v, encodingAesKey: e.target.value }))} />
          </label>
          <label className="text-sm text-[#c7d7ca]">
            默认分享标题
            <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={wechatForm.shareTitle} onChange={(e) => setWechatForm((v) => ({ ...v, shareTitle: e.target.value }))} />
          </label>
          <label className="text-sm text-[#c7d7ca]">
            默认分享描述
            <textarea className="mt-1 min-h-20 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 py-2 text-[#eef7ef]" value={wechatForm.shareDescription} onChange={(e) => setWechatForm((v) => ({ ...v, shareDescription: e.target.value }))} />
          </label>
          <label className="text-sm text-[#c7d7ca]">
            分享图片地址
            <input className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#eef7ef]" value={wechatForm.shareImageUrl} onChange={(e) => setWechatForm((v) => ({ ...v, shareImageUrl: e.target.value }))} />
          </label>
          <p className="rounded-xl bg-[#132d21] px-3 py-3 text-xs leading-5 text-[#9db4a5]">这里保存公众号/服务号接口配置。JS-SDK 签名接口和微信登录可基于这些配置继续接入。</p>
          <button className="min-h-10 rounded-xl bg-[#36d37e] px-4 text-sm font-semibold text-[#07110d] disabled:opacity-50" disabled={submitting === "wechat"} onClick={saveWechat} type="button">
            {submitting === "wechat" ? "保存中" : "保存微信设置"}
          </button>
        </div>
      </section>

      {message ? <p className="rounded-xl border border-white/8 bg-[#07110d] px-3 py-2 text-sm text-[#f6c85f] lg:col-span-2">{message}</p> : null}
    </div>
  );
}
