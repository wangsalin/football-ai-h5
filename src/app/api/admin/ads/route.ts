import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isSensitiveContentError } from "@/lib/content-compliance";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { createAdminAdCampaign } from "@/services/admin-data";
import { adCampaignWriteSchema, toAdCampaignWriteInput } from "./schema";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ADMIN")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权创建广告计划"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adCampaignWriteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "广告计划参数错误", parsed.error.flatten()), { status: 422 });
  }

  try {
    const campaign = await createAdminAdCampaign({
      ...toAdCampaignWriteInput(parsed.data),
      actor: user,
    });

    return NextResponse.json(ok({ campaign }), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "HOME_BANNER_IMAGE_REQUIRED") {
      return NextResponse.json(fail("VALIDATION_ERROR", "首页轮播 Banner 必须填写图片地址"), { status: 422 });
    }

    if (isSensitiveContentError(error)) {
      return NextResponse.json(fail("SENSITIVE_WORD_DETECTED", `广告文案包含敏感词：${error.words.join("、")}`), {
        status: 422,
      });
    }

    console.error("Failed to create ad campaign", error);
    return NextResponse.json(fail("CREATE_FAILED", "广告计划创建失败，请稍后重试"), { status: 409 });
  }
}
