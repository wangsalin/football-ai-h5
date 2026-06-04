import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { createAdminMatch } from "@/services/admin-data";
import { matchWriteSchema, toMatchWriteInput } from "../schema";

const importSchema = z.object({
  matches: z.array(matchWriteSchema).min(1).max(50),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ANALYST")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权导入赛事"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = importSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "赛事导入参数错误", parsed.error.flatten()), { status: 422 });
  }

  const imported = [];
  for (const match of parsed.data.matches) {
    const created = await createAdminMatch({
      ...toMatchWriteInput(match),
      actor: user,
    });
    imported.push(created);
  }

  return NextResponse.json(ok({ imported, count: imported.length }), { status: 201 });
}
