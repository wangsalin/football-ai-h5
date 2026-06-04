import type { AppUser, AppUserRole } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasRole } from "@/lib/permissions";

export type JobAuthResult =
  | { ok: true; user: AppUser; via: "session" | "cron" }
  | { ok: false; status: 401 | 403; code: string; message: string };

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
}

function hasValidCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const provided = request.headers.get("x-cron-secret")?.trim() || readBearerToken(request);
  return provided === secret;
}

async function getCronActor(requiredRole: AppUserRole): Promise<AppUser | null> {
  const user = await prisma.user.findFirst({
    where: {
      status: "ACTIVE",
      role: { in: ["SUPER_ADMIN", "ADMIN", "ANALYST"] },
    },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      phone: true,
      nickname: true,
      role: true,
    },
  });

  if (!user || !hasRole(user.role, requiredRole)) {
    return null;
  }

  return {
    id: user.id,
    phone: user.phone ?? "",
    nickname: user.nickname ?? "系统任务",
    role: user.role,
  };
}

export async function authorizeJobRequest(request: Request, requiredRole: AppUserRole): Promise<JobAuthResult> {
  if (hasValidCronSecret(request)) {
    const cronActor = await getCronActor(requiredRole);

    if (!cronActor) {
      return { ok: false, status: 403, code: "CRON_ACTOR_NOT_FOUND", message: "没有可用于执行任务的后台账号" };
    }

    return { ok: true, user: cronActor, via: "cron" };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, status: 401, code: "UNAUTHORIZED", message: "登录已失效，请重新登录" };
  }

  if (!hasRole(user.role, requiredRole)) {
    return { ok: false, status: 403, code: "FORBIDDEN", message: "当前账号无权运行自动任务" };
  }

  return { ok: true, user, via: "session" };
}
