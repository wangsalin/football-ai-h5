import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { updateAdminAccount } from "@/services/admin-data";
import { adminAccountWriteSchema } from "../schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ADMIN")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权管理管理员账号"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminAccountWriteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "管理员账号参数错误", parsed.error.flatten()), { status: 422 });
  }

  const { id } = await context.params;

  try {
    const account = await updateAdminAccount(id, { ...parsed.data, actor: user });

    if (!account) {
      return NextResponse.json(fail("NOT_FOUND", "管理员账号不存在"), { status: 404 });
    }

    return NextResponse.json(ok({ account }));
  } catch (error) {
    if (error instanceof Error && error.message === "SELF_DISABLE_NOT_ALLOWED") {
      return NextResponse.json(fail("SELF_DISABLE_NOT_ALLOWED", "不能禁用当前登录账号"), { status: 409 });
    }

    if (
      error instanceof Error &&
      (error.message.includes("Unique constraint failed") || error.message.includes("duplicate key"))
    ) {
      return NextResponse.json(fail("ACCOUNT_EXISTS", "账号或手机号已被使用"), { status: 409 });
    }

    console.error("Failed to update admin account", error);
    return NextResponse.json(fail("UPDATE_FAILED", "管理员账号更新失败，请稍后重试"), { status: 409 });
  }
}
