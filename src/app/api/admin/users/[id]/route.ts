import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { updateAdminUser } from "@/services/admin-data";
import { adminUserWriteSchema } from "../schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ADMIN")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权修改用户"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminUserWriteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "用户参数错误", parsed.error.flatten()), { status: 422 });
  }

  const { id } = await context.params;

  try {
    const updated = await updateAdminUser(id, {
      ...parsed.data,
      actor: user,
    });

    if (!updated) {
      return NextResponse.json(fail("NOT_FOUND", "用户不存在"), { status: 404 });
    }

    return NextResponse.json(ok({ user: updated }));
  } catch (error) {
    if (error instanceof Error && error.message === "SELF_DISABLE_NOT_ALLOWED") {
      return NextResponse.json(fail("SELF_DISABLE_NOT_ALLOWED", "不能禁用当前登录账号"), { status: 409 });
    }

    if (
      error instanceof Error &&
      (error.message.includes("Unique constraint failed") || error.message.includes("duplicate key"))
    ) {
      return NextResponse.json(fail("PHONE_EXISTS", "手机号已被其他用户使用"), { status: 409 });
    }

    console.error("Failed to update admin user", error);
    return NextResponse.json(fail("UPDATE_FAILED", "用户更新失败，请稍后重试"), { status: 409 });
  }
}
