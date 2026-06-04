import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { updateRegistrationSettings } from "@/services/admin-settings";

const registrationSettingsSchema = z.object({
  enabled: z.boolean(),
  defaultRole: z.enum(["USER", "ADVERTISER"]),
  disabledMessage: z.string().trim().min(1).max(120),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ADMIN")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权修改注册设置"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registrationSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "注册设置参数错误", parsed.error.flatten()), { status: 422 });
  }

  const settings = await updateRegistrationSettings({ ...parsed.data, actor: user });

  return NextResponse.json(ok({ settings }));
}
