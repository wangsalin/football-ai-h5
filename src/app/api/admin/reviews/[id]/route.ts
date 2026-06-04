import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertNoSensitiveWords, isSensitiveContentError } from "@/lib/content-compliance";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { updateAdminReview } from "@/services/admin-data";
import { reviewWriteSchema, toReviewWriteInput } from "../schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ANALYST")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权编辑复盘"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reviewWriteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "复盘参数错误", parsed.error.flatten()), { status: 422 });
  }

  try {
    assertNoSensitiveWords([
      parsed.data.actualResult,
      parsed.data.hitSummary,
      parsed.data.missReason,
      parsed.data.correctionNote,
    ]);
  } catch (error) {
    if (isSensitiveContentError(error)) {
      return NextResponse.json(fail("SENSITIVE_WORD_DETECTED", `内容包含敏感词：${error.words.join("、")}`), {
        status: 422,
      });
    }

    throw error;
  }

  const { id } = await context.params;

  try {
    const review = await updateAdminReview(id, {
      ...toReviewWriteInput(parsed.data),
      actor: user,
    });

    if (!review) {
      return NextResponse.json(fail("NOT_FOUND", "复盘不存在"), { status: 404 });
    }

    return NextResponse.json(ok({ review }));
  } catch (error) {
    console.error("Failed to update review", error);
    return NextResponse.json(fail("UPDATE_FAILED", "编辑复盘失败，请确认赛事和预测存在"), { status: 409 });
  }
}
