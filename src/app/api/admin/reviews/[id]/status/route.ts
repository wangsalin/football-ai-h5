import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { updateReviewStatus } from "@/services/admin-data";

const statusSchema = z.object({
  status: z.enum(["PUBLISHED", "OFFLINE"]),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ANALYST")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权修改复盘状态"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "复盘状态参数错误", parsed.error.flatten()), { status: 422 });
  }

  const { id } = await context.params;
  const review = await updateReviewStatus({
    reviewId: id,
    status: parsed.data.status,
    actor: user,
  });

  if (!review) {
    return NextResponse.json(fail("NOT_FOUND", "复盘不存在"), { status: 404 });
  }

  return NextResponse.json(ok({ review }));
}
