import { NextResponse } from "next/server";
import { createDbSession, sessionCookieName, sessionCookieOptions, verifyHash } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessAdmin } from "@/lib/permissions";
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

  const body = (await request.json().catch(() => null)) as { username?: string; password?: string } | null;
  const username = body?.username?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  if (!/^[a-z0-9_-]{3,32}$/.test(username)) {
    return NextResponse.json(fail("VALIDATION_ERROR", "请输入正确的管理账号"), { status: 422 });
  }

  if (password.length < 8 || password.length > 128) {
    return NextResponse.json(fail("VALIDATION_ERROR", "请输入正确的密码"), { status: 422 });
  }

  const [accountLimit, ipLimit] = await Promise.all([
    rateLimit({ key: `rl:admin-login:account:${buildRateLimitKey([username])}`, limit: 8, windowSeconds: 15 * 60 }),
    rateLimit({ key: `rl:admin-login:ip:${buildRateLimitKey([getClientIp(request)])}`, limit: 40, windowSeconds: 15 * 60 }),
  ]);

  if (!accountLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json(fail("RATE_LIMITED", "登录尝试过于频繁，请稍后再试"), { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || !user.passwordHash || user.status !== "ACTIVE" || !canAccessAdmin(user.role)) {
    return NextResponse.json(fail("INVALID_CREDENTIALS", "账号或密码错误"), { status: 401 });
  }

  if (!verifyHash(password, user.passwordHash)) {
    return NextResponse.json(fail("INVALID_CREDENTIALS", "账号或密码错误"), { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const appUser = {
    id: user.id,
    phone: user.phone ?? "",
    nickname: user.nickname ?? username,
    role: user.role,
  };
  const session = await createDbSession(user.id);
  const response = NextResponse.json(ok({ user: appUser }));

  response.cookies.set(sessionCookieName, session.rawToken, sessionCookieOptions(30 * 24 * 60 * 60));

  return response;
}
