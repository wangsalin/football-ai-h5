import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertNoSensitiveWords, isSensitiveContentError } from "@/lib/content-compliance";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { updateAdminPrediction } from "@/services/admin-data";
import { predictionWriteSchema, toPredictionWriteInput } from "../schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ANALYST")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权编辑预测"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = predictionWriteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "预测参数错误", parsed.error.flatten()), { status: 422 });
  }

  try {
    assertNoSensitiveWords([
      parsed.data.summary,
      parsed.data.winDrawLossPick,
      parsed.data.handicapPick,
      parsed.data.scorePicks,
      parsed.data.totalGoalsPick,
      parsed.data.halfFullPick,
      parsed.data.coldAlertReason,
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
    const prediction = await updateAdminPrediction(id, {
      ...toPredictionWriteInput(parsed.data),
      actor: user,
    });

    if (!prediction) {
      return NextResponse.json(fail("NOT_FOUND", "预测不存在"), { status: 404 });
    }

    return NextResponse.json(ok({ prediction }));
  } catch (error) {
    console.error("Failed to update prediction", error);
    return NextResponse.json(fail("UPDATE_FAILED", "编辑预测失败，请确认赛事没有关联其他预测"), { status: 409 });
  }
}
