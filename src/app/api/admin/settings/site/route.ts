import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { updateSiteSettings } from "@/services/admin-settings";

const siteSettingsSchema = z.object({
  siteName: z.string().trim().min(1, "请填写网站名称").max(40, "网站名称不能超过 40 个字符"),
  siteDomain: z.string().trim().min(1, "请填写域名").max(120, "域名不能超过 120 个字符"),
  publicBaseUrl: z.string().trim().url("请填写完整访问地址，例如 https://example.com"),
  adminBasePath: z
    .string()
    .trim()
    .regex(/^\/[a-z0-9/_-]*$/i, "后台路径必须以 / 开头，只能包含字母、数字、横线和下划线"),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ADMIN")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权修改站点设置"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = siteSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "站点设置参数错误", parsed.error.flatten()), { status: 422 });
  }

  const settings = await updateSiteSettings({ ...parsed.data, actor: user });
  return NextResponse.json(ok({ settings }));
}
