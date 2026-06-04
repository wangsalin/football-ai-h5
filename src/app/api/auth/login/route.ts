import { NextResponse } from "next/server";
import {
  createDbSession,
  findOrCreateUserByPhone,
  isValidPhone,
  sessionCookieName,
  sessionCookieOptions,
  verifyHash,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildRateLimitKey, getClientIp, rateLimit } from "@/lib/rate-limit";
import { fail, ok } from "@/lib/response";
import { assertProductionRuntimeConfig } from "@/lib/runtime-config";

export async function POST(request: Request) {
  try {
    assertProductionRuntimeConfig();
  } catch (error) {
    console.error("Invalid production auth configuration", error);
    return NextResponse.json(fail("CONFIG_ERROR", "认证配置未完成，请联系管理员"), { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as { phone?: string; code?: string } | null;
  const phone = body?.phone?.trim() ?? "";
  const code = body?.code?.trim() ?? "";

  if (!isValidPhone(phone)) {
    return NextResponse.json(fail("VALIDATION_ERROR", "请输入正确的手机号"), { status: 422 });
  }

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(fail("VALIDATION_ERROR", "请输入 6 位验证码"), { status: 422 });
  }

  const [phoneLimit, ipLimit] = await Promise.all([
    rateLimit({ key: `rl:login:phone:${buildRateLimitKey([phone])}`, limit: 10, windowSeconds: 15 * 60 }),
    rateLimit({ key: `rl:login:ip:${buildRateLimitKey([getClientIp(request)])}`, limit: 60, windowSeconds: 15 * 60 }),
  ]);

  if (!phoneLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json(fail("RATE_LIMITED", "登录尝试过于频繁，请稍后再试"), { status: 429 });
  }

  const verificationCode = await prisma.verificationCode.findFirst({
    where: {
      phone,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!verificationCode || !verifyHash(code, verificationCode.codeHash)) {
    return NextResponse.json(fail("INVALID_CODE", "验证码错误或已过期，请重新获取"), { status: 401 });
  }

  await prisma.verificationCode.update({
    where: { id: verificationCode.id },
    data: { usedAt: new Date() },
  });

  let user;

  try {
    user = await findOrCreateUserByPhone(phone);
  } catch (error) {
    if (error instanceof Error && error.message === "REGISTRATION_DISABLED") {
      return NextResponse.json(fail("REGISTRATION_DISABLED", "当前暂未开放新用户注册，请联系管理员"), { status: 403 });
    }

    throw error;
  }

  const session = await createDbSession(user.id);
  const response = NextResponse.json(ok({ user }));

  response.cookies.set(sessionCookieName, session.rawToken, sessionCookieOptions(30 * 24 * 60 * 60));

  return response;
}
