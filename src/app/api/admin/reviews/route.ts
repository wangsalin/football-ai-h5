import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertNoSensitiveWords, isSensitiveContentError } from "@/lib/content-compliance";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { createAdminReview } from "@/services/admin-data";
import { reviewWriteSchema, toReviewWriteInput } from "./schema";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ANALYST")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权创建复盘"), { status: 403 });
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

  try {
    const review = await createAdminReview({
      ...toReviewWriteInput(parsed.data),
      actor: user,
    });

    return NextResponse.json(ok({ review }), { status: 201 });
  } catch (error) {
    console.error("Failed to create review", error);
    return NextResponse.json(fail("CREATE_FAILED", "创建复盘失败，请确认赛事和预测存在"), { status: 409 });
  }
}
