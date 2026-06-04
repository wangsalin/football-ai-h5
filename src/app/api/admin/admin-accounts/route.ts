import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { createAdminAccount } from "@/services/admin-data";
import { adminAccountCreateSchema } from "./schema";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ADMIN")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权管理管理员账号"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminAccountCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "管理员账号参数错误", parsed.error.flatten()), { status: 422 });
  }

  try {
    const account = await createAdminAccount({ ...parsed.data, actor: user });
    return NextResponse.json(ok({ account }));
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("Unique constraint failed") || error.message.includes("duplicate key"))
    ) {
      return NextResponse.json(fail("ACCOUNT_EXISTS", "账号或手机号已被使用"), { status: 409 });
    }

    console.error("Failed to create admin account", error);
    return NextResponse.json(fail("CREATE_FAILED", "管理员账号创建失败，请稍后重试"), { status: 409 });
  }
}
