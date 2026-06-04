import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSessionSecret, shouldUseSecureCookies } from "@/lib/runtime-config";
import { getRegistrationSettings } from "@/services/admin-settings";

export const sessionCookieName = "football_ai_session";

export type AppUserRole = "USER" | "ADVERTISER" | "ANALYST" | "ADMIN" | "SUPER_ADMIN";

export type AppUser = {
  id: string;
  phone: string;
  nickname: string;
  role: AppUserRole;
};

export const mockUsers: AppUser[] = [
  { id: "u_001", phone: "13800000001", nickname: "普通用户", role: "USER" },
  { id: "u_002", phone: "13800000002", nickname: "广告主", role: "ADVERTISER" },
  { id: "u_003", phone: "13800000003", nickname: "分析师", role: "ANALYST" },
  { id: "u_004", phone: "13800000004", nickname: "管理员", role: "ADMIN" },
  { id: "u_005", phone: "13800000005", nickname: "超级管理员", role: "SUPER_ADMIN" },
];

export function isValidPhone(phone: string) {
  return /^1[3-9]\d{9}$/.test(phone);
}

export function maskPhone(phone: string) {
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
}

export function hashValue(value: string) {
  return createHash("sha256").update(`${getSessionSecret()}:${value}`).digest("hex");
}

export function verifyHash(value: string, hash: string) {
  const current = Buffer.from(hashValue(value));
  const expected = Buffer.from(hash);

  return current.length === expected.length && timingSafeEqual(current, expected);
}

export function createRawSessionToken() {
  return randomBytes(32).toString("base64url");
}

export async function createDbSession(userId: string) {
  const rawToken = createRawSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashValue(rawToken),
      expiresAt,
    },
  });

  return {
    rawToken,
    expiresAt,
  };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(sessionCookieName)?.value;

  if (!rawToken) {
    return null;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashValue(rawToken) },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || session.user.status !== "ACTIVE") {
      return null;
    }

    return {
      id: session.user.id,
      phone: session.user.phone ?? "",
      nickname: session.user.nickname ?? "用户",
      role: session.user.role,
    };
  } catch {
    return null;
  }
}

export async function clearDbSession(rawToken: string | undefined) {
  if (!rawToken) {
    return;
  }

  await prisma.session.deleteMany({
    where: {
      tokenHash: hashValue(rawToken),
    },
  });
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge,
  };
}

export async function findOrCreateUserByPhone(phone: string): Promise<AppUser> {
  const seededUser = mockUsers.find((user) => user.phone === phone);
  const existing = await prisma.user.findUnique({
    where: { phone },
  });
  const registrationSettings = existing ? null : await getRegistrationSettings();

  if (!existing && registrationSettings?.enabled === false) {
    throw new Error("REGISTRATION_DISABLED");
  }

  const user =
    existing ??
    (await prisma.user.create({
      data: {
        phone,
        nickname: seededUser?.nickname ?? "新用户",
        role: seededUser?.role ?? registrationSettings?.defaultRole ?? "USER",
      },
    }));

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    id: user.id,
    phone: user.phone ?? phone,
    nickname: user.nickname ?? seededUser?.nickname ?? "用户",
    role: user.role,
  };
}
