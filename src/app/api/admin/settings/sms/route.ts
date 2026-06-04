import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { updateSmsSettings } from "@/services/admin-settings";

const smsSettingsSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(["mock", "aliyun", "tencent", "custom_http"]),
  endpointUrl: z.string().trim().optional().default(""),
  method: z.enum(["POST", "GET"]),
  appKey: z.string().trim().optional().default(""),
  appSecret: z.string().optional().default(""),
  appSecretSet: z.boolean().optional().default(false),
  sdkAppId: z.string().trim().optional().default(""),
  region: z.string().trim().optional().default("ap-guangzhou"),
  signName: z.string().trim().optional().default(""),
  templateId: z.string().trim().optional().default(""),
  loginTemplateId: z.string().trim().optional().default(""),
  registerTemplateId: z.string().trim().optional().default(""),
  resetPasswordTemplateId: z.string().trim().optional().default(""),
  headersJson: z.string().trim().min(2),
  bodyTemplate: z.string().trim().min(2),
  successKeyword: z.string().trim().optional().default(""),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ADMIN")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权修改短信设置"), { status: 403 });
  }

  const parsed = smsSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "短信设置参数错误", parsed.error.flatten()), { status: 422 });
  }

  if (parsed.data.provider === "custom_http" && parsed.data.enabled && !parsed.data.endpointUrl) {
    return NextResponse.json(fail("VALIDATION_ERROR", "启用自定义短信接口时必须填写接口地址"), { status: 422 });
  }

  if (parsed.data.enabled && parsed.data.provider === "aliyun") {
    if (
      !parsed.data.appKey ||
      (!parsed.data.appSecret && !parsed.data.appSecretSet) ||
      !parsed.data.signName ||
      !parsed.data.loginTemplateId ||
      !parsed.data.registerTemplateId ||
      !parsed.data.resetPasswordTemplateId
    ) {
      return NextResponse.json(fail("VALIDATION_ERROR", "启用阿里云短信时必须填写 AccessKey、签名和三个模板 Code"), {
        status: 422,
      });
    }
  }

  if (parsed.data.enabled && parsed.data.provider === "tencent") {
    if (
      !parsed.data.appKey ||
      (!parsed.data.appSecret && !parsed.data.appSecretSet) ||
      !parsed.data.sdkAppId ||
      !parsed.data.signName ||
      !parsed.data.loginTemplateId ||
      !parsed.data.registerTemplateId ||
      !parsed.data.resetPasswordTemplateId
    ) {
      return NextResponse.json(fail("VALIDATION_ERROR", "启用腾讯云短信时必须填写 SecretId、SdkAppId、签名和三个模板 ID"), {
        status: 422,
      });
    }
  }

  return NextResponse.json(ok({ settings: await updateSmsSettings({ ...parsed.data, actor: user }) }));
}
