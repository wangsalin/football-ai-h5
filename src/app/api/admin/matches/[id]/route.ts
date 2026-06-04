import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { updateAdminMatch } from "@/services/admin-data";
import { matchWriteSchema, toMatchWriteInput } from "../schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ANALYST")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权编辑赛事"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = matchWriteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "赛事参数错误", parsed.error.flatten()), { status: 422 });
  }

  const { id } = await context.params;
  const match = await updateAdminMatch(id, {
    ...toMatchWriteInput(parsed.data),
    actor: user,
  });

  if (!match) {
    return NextResponse.json(fail("NOT_FOUND", "赛事不存在"), { status: 404 });
  }

  return NextResponse.json(ok({ match }));
}
