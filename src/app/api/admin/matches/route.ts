import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { createAdminMatch } from "@/services/admin-data";
import { matchWriteSchema, toMatchWriteInput } from "./schema";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ANALYST")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权创建赛事"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = matchWriteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "赛事参数错误", parsed.error.flatten()), { status: 422 });
  }

  const match = await createAdminMatch({
    ...toMatchWriteInput(parsed.data),
    actor: user,
  });

  return NextResponse.json(ok({ match }), { status: 201 });
}
