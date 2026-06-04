import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { fail, ok } from "@/lib/response";
import { getPublicBaseUrl, toAbsolutePublicUrl } from "@/lib/share-metadata";
import { getSiteSettings, getWechatSettings } from "@/services/admin-settings";

type WechatCache = {
  accessToken?: string;
  accessTokenExpiresAt?: number;
  jsapiTicket?: string;
  jsapiTicketExpiresAt?: number;
};

const globalForWechat = globalThis as unknown as {
  wechatShareCache?: WechatCache;
};

const cache = globalForWechat.wechatShareCache ?? {};
globalForWechat.wechatShareCache = cache;

function createNonce() {
  return crypto.randomBytes(12).toString("hex");
}

function sha1(value: string) {
  return crypto.createHash("sha1").update(value).digest("hex");
}

async function fetchWechatJson<T>(url: string): Promise<T & { errcode?: number; errmsg?: string }> {
  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json()) as T & { errcode?: number; errmsg?: string };

  if (!response.ok || (typeof data.errcode === "number" && data.errcode !== 0)) {
    throw new Error(data.errmsg || `Wechat API failed: ${response.status}`);
  }

  return data;
}

async function getAccessToken(appId: string, appSecret: string) {
  const now = Date.now();
  if (cache.accessToken && cache.accessTokenExpiresAt && cache.accessTokenExpiresAt > now + 60_000) {
    return cache.accessToken;
  }

  const data = await fetchWechatJson<{ access_token: string; expires_in: number }>(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(appSecret)}`,
  );

  cache.accessToken = data.access_token;
  cache.accessTokenExpiresAt = now + Math.max(300, data.expires_in - 300) * 1000;
  cache.jsapiTicket = undefined;
  cache.jsapiTicketExpiresAt = undefined;
  return data.access_token;
}

async function getJsapiTicket(accessToken: string) {
  const now = Date.now();
  if (cache.jsapiTicket && cache.jsapiTicketExpiresAt && cache.jsapiTicketExpiresAt > now + 60_000) {
    return cache.jsapiTicket;
  }

  const data = await fetchWechatJson<{ ticket: string; expires_in: number }>(
    `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${encodeURIComponent(accessToken)}&type=jsapi`,
  );

  cache.jsapiTicket = data.ticket;
  cache.jsapiTicketExpiresAt = now + Math.max(300, data.expires_in - 300) * 1000;
  return data.ticket;
}

export async function GET(request: Request) {
  const requestedUrl = new URL(request.url).searchParams.get("url")?.trim();
  if (!requestedUrl) {
    return NextResponse.json(fail("VALIDATION_ERROR", "缺少分享页面地址"), { status: 422 });
  }

  const [wechatSettings, siteSettings] = await Promise.all([getWechatSettings(), getSiteSettings()]);
  if (!wechatSettings.enabled || !wechatSettings.jsSdkEnabled) {
    return NextResponse.json(fail("WECHAT_DISABLED", "微信 JS-SDK 未启用"), { status: 400 });
  }

  if (!wechatSettings.appId || !wechatSettings.appSecret) {
    return NextResponse.json(fail("WECHAT_NOT_CONFIGURED", "微信 App ID 或 App Secret 未配置"), { status: 400 });
  }

  const baseUrl = siteSettings.publicBaseUrl || getPublicBaseUrl();
  const timestamp = Math.floor(Date.now() / 1000);
  const nonceStr = createNonce();
  const accessToken = await getAccessToken(wechatSettings.appId, wechatSettings.appSecret);
  const jsapiTicket = await getJsapiTicket(accessToken);
  const signature = sha1(
    [`jsapi_ticket=${jsapiTicket}`, `noncestr=${nonceStr}`, `timestamp=${timestamp}`, `url=${requestedUrl}`].join("&"),
  );

  const share = {
    title: wechatSettings.shareTitle,
    desc: wechatSettings.shareDescription,
    link: requestedUrl,
    imgUrl: toAbsolutePublicUrl(wechatSettings.shareImageUrl, baseUrl),
  };

  return NextResponse.json(
    ok({
      appId: wechatSettings.appId,
      timestamp,
      nonceStr,
      signature,
      share,
    }),
  );
}
