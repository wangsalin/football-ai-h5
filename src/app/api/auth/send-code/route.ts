import { createHash, createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { hashValue, isValidPhone } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildRateLimitKey, getClientIp, rateLimit } from "@/lib/rate-limit";
import { fail, ok } from "@/lib/response";
import { assertProductionRuntimeConfig, isMockSmsEnabled } from "@/lib/runtime-config";
import { getSmsSettings } from "@/services/admin-settings";

type SmsPurpose = "login" | "register" | "reset_password";

function applySmsTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((current, [key, value]) => current.replaceAll(`{{${key}}}`, value), template);
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hmacSha256Hex(secret: string | Buffer, value: string) {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

function hmacSha256(secret: string | Buffer, value: string) {
  return createHmac("sha256", secret).update(value, "utf8").digest();
}

function encodeAliyunParam(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildAliyunQuery(params: Record<string, string>) {
  return Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeAliyunParam(key)}=${encodeAliyunParam(value)}`)
    .join("&");
}

function getTemplateId(settings: Awaited<ReturnType<typeof getSmsSettings>>, purpose: SmsPurpose) {
  if (purpose === "register") {
    return settings.registerTemplateId || settings.templateId;
  }

  if (purpose === "reset_password") {
    return settings.resetPasswordTemplateId || settings.templateId;
  }

  return settings.loginTemplateId || settings.templateId;
}

async function sendAliyunSmsCode(phone: string, code: string, purpose: SmsPurpose, settings: Awaited<ReturnType<typeof getSmsSettings>>) {
  const host = "dysmsapi.aliyuncs.com";
  const query = buildAliyunQuery({
    PhoneNumbers: phone,
    SignName: settings.signName,
    TemplateCode: getTemplateId(settings, purpose),
    TemplateParam: JSON.stringify({ code }),
  });
  const payloadHash = sha256Hex("");
  const headers: Record<string, string> = {
    host,
    "x-acs-action": "SendSms",
    "x-acs-content-sha256": payloadHash,
    "x-acs-date": new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    "x-acs-signature-nonce": randomUUID(),
    "x-acs-version": "2017-05-25",
  };
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key}:${headers[key].trim()}\n`)
    .join("");
  const canonicalRequest = ["POST", "/", query, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const stringToSign = `ACS3-HMAC-SHA256\n${sha256Hex(canonicalRequest)}`;
  const signature = hmacSha256Hex(settings.appSecret, stringToSign);
  const response = await fetch(`https://${host}/?${query}`, {
    method: "POST",
    headers: {
      ...headers,
      Authorization: `ACS3-HMAC-SHA256 Credential=${settings.appKey},SignedHeaders=${signedHeaders},Signature=${signature}`,
      Accept: "application/json",
    },
  });
  const result = (await response.json().catch(() => null)) as { Code?: string; Message?: string } | null;

  if (!response.ok || result?.Code !== "OK") {
    throw new Error(`ALIYUN_SMS_SEND_FAILED:${result?.Code ?? response.status}:${result?.Message ?? ""}`);
  }
}

async function sendTencentSmsCode(phone: string, code: string, purpose: SmsPurpose, settings: Awaited<ReturnType<typeof getSmsSettings>>) {
  const host = "sms.tencentcloudapi.com";
  const service = "sms";
  const action = "SendSms";
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const payload = JSON.stringify({
    PhoneNumberSet: [`+86${phone}`],
    SmsSdkAppId: settings.sdkAppId,
    SignName: settings.signName,
    TemplateId: getTemplateId(settings, purpose),
    TemplateParamSet: [code],
  });
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${host}\nx-tc-action:${action.toLowerCase()}\n`;
  const signedHeaders = "content-type;host;x-tc-action";
  const canonicalRequest = ["POST", "/", "", canonicalHeaders, signedHeaders, sha256Hex(payload)].join("\n");
  const credentialScope = `${date}/${service}/tc3_request`;
  const stringToSign = ["TC3-HMAC-SHA256", String(timestamp), credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const secretDate = hmacSha256(`TC3${settings.appSecret}`, date);
  const secretService = hmacSha256(secretDate, service);
  const secretSigning = hmacSha256(secretService, "tc3_request");
  const signature = hmacSha256Hex(secretSigning, stringToSign);
  const authorization = `TC3-HMAC-SHA256 Credential=${settings.appKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const response = await fetch(`https://${host}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json; charset=utf-8",
      Host: host,
      "X-TC-Action": action,
      "X-TC-Timestamp": String(timestamp),
      "X-TC-Version": "2021-01-11",
      "X-TC-Region": settings.region,
    },
    body: payload,
  });
  const result = (await response.json().catch(() => null)) as {
    Response?: { Error?: { Code?: string; Message?: string }; SendStatusSet?: Array<{ Code?: string; Message?: string }> };
  } | null;
  const status = result?.Response?.SendStatusSet?.[0];

  if (!response.ok || result?.Response?.Error || status?.Code !== "Ok") {
    throw new Error(
      `TENCENT_SMS_SEND_FAILED:${result?.Response?.Error?.Code ?? status?.Code ?? response.status}:${
        result?.Response?.Error?.Message ?? status?.Message ?? ""
      }`,
    );
  }
}

async function sendSmsCode(phone: string, code: string, purpose: SmsPurpose) {
  const settings = await getSmsSettings();

  if (!settings.enabled || settings.provider === "mock") {
    throw new Error("SMS_NOT_CONFIGURED");
  }

  if (settings.provider === "aliyun") {
    await sendAliyunSmsCode(phone, code, purpose, settings);
    return;
  }

  if (settings.provider === "tencent") {
    await sendTencentSmsCode(phone, code, purpose, settings);
    return;
  }

  const templateId = getTemplateId(settings, purpose);
  const values = {
    phone,
    code,
    appKey: settings.appKey,
    appSecret: settings.appSecret,
    signName: settings.signName,
    templateId,
  };
  const headers = JSON.parse(applySmsTemplate(settings.headersJson, values)) as Record<string, string>;
  const body = applySmsTemplate(settings.bodyTemplate, values);
  const url =
    settings.method === "GET"
      ? `${settings.endpointUrl}${settings.endpointUrl.includes("?") ? "&" : "?"}${new URLSearchParams(JSON.parse(body) as Record<string, string>).toString()}`
      : settings.endpointUrl;
  const response = await fetch(url, {
    method: settings.method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: settings.method === "POST" ? body : undefined,
  });
  const text = await response.text().catch(() => "");

  if (!response.ok || (settings.successKeyword && !text.includes(settings.successKeyword))) {
    throw new Error("SMS_SEND_FAILED");
  }
}

export async function POST(request: Request) {
  try {
    assertProductionRuntimeConfig();
  } catch (error) {
    console.error("Invalid production SMS configuration", error);
    return NextResponse.json(fail("CONFIG_ERROR", "短信配置未完成，请联系管理员"), { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as { phone?: string; purpose?: string } | null;
  const phone = body?.phone?.trim() ?? "";

  if (!isValidPhone(phone)) {
    return NextResponse.json(fail("VALIDATION_ERROR", "请输入正确的手机号"), { status: 422 });
  }

  const [phoneLimit, ipLimit] = await Promise.all([
    rateLimit({ key: `rl:sms:phone:${buildRateLimitKey([phone])}`, limit: 20, windowSeconds: 60 * 60 }),
    rateLimit({ key: `rl:sms:ip:${buildRateLimitKey([getClientIp(request)])}`, limit: 200, windowSeconds: 60 * 60 }),
  ]);

  if (!phoneLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json(fail("RATE_LIMITED", "验证码获取过于频繁，请稍后再试"), { status: 429 });
  }

  const mockEnabled = isMockSmsEnabled();
  const code = mockEnabled ? "123456" : String(Math.floor(100000 + Math.random() * 900000));
  const explicitPurpose =
    body?.purpose === "login" || body?.purpose === "register" || body?.purpose === "reset_password" ? body.purpose : null;
  const purpose =
    explicitPurpose ??
    ((await prisma.user.findFirst({ where: { phone }, select: { id: true } })) ? "login" : "register");

  if (!mockEnabled) {
    try {
      await sendSmsCode(phone, code, purpose);
    } catch (error) {
      console.error("Failed to send SMS code", error);
      return NextResponse.json(fail("SMS_SEND_FAILED", "短信发送失败，请检查短信接口配置"), { status: 502 });
    }
  }

  await prisma.verificationCode.create({
    data: {
      phone,
      codeHash: hashValue(code),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  return NextResponse.json(
    ok({
      phone,
      code: mockEnabled ? code : undefined,
      expiresIn: 300,
    }),
  );
}
