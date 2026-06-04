import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isSensitiveContentError } from "@/lib/content-compliance";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { updateAdminAdCampaign } from "@/services/admin-data";
import { adCampaignWriteSchema, toAdCampaignWriteInput } from "../schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ADMIN")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权编辑广告计划"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adCampaignWriteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "广告计划参数错误", parsed.error.flatten()), { status: 422 });
  }

  const { id } = await context.params;

  try {
    const campaign = await updateAdminAdCampaign(id, {
      ...toAdCampaignWriteInput(parsed.data),
      actor: user,
    });

    if (!campaign) {
      return NextResponse.json(fail("NOT_FOUND", "广告计划不存在"), { status: 404 });
    }

    return NextResponse.json(ok({ campaign }));
  } catch (error) {
    if (error instanceof Error && error.message === "HOME_BANNER_IMAGE_REQUIRED") {
      return NextResponse.json(fail("VALIDATION_ERROR", "首页轮播 Banner 必须填写图片地址"), { status: 422 });
    }

    if (isSensitiveContentError(error)) {
      return NextResponse.json(fail("SENSITIVE_WORD_DETECTED", `广告文案包含敏感词：${error.words.join("、")}`), {
        status: 422,
      });
    }

    console.error("Failed to update ad campaign", error);
    return NextResponse.json(fail("UPDATE_FAILED", "广告计划编辑失败，请稍后重试"), { status: 409 });
  }
}
