import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isSensitiveContentError } from "@/lib/content-compliance";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { updateAdCampaignStatus } from "@/services/admin-data";

const statusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectReason: z.string().max(200).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ADMIN")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权审核广告"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "广告审核状态参数错误", parsed.error.flatten()), { status: 422 });
  }

  const { id } = await context.params;

  try {
    const campaign = await updateAdCampaignStatus({
      campaignId: id,
      status: parsed.data.status,
      rejectReason: parsed.data.rejectReason,
      actor: user,
    });

    if (!campaign) {
      return NextResponse.json(fail("NOT_FOUND", "广告计划不存在"), { status: 404 });
    }

    return NextResponse.json(ok({ campaign }));
  } catch (error) {
    if (isSensitiveContentError(error)) {
      return NextResponse.json(fail("SENSITIVE_WORD_DETECTED", `广告文案包含敏感词：${error.words.join("、")}`), {
        status: 422,
      });
    }

    console.error("Failed to update ad campaign status", error);
    return NextResponse.json(fail("UPDATE_FAILED", "广告审核失败，请稍后重试"), { status: 409 });
  }
}
