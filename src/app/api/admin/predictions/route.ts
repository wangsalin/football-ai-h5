import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertNoSensitiveWords, isSensitiveContentError } from "@/lib/content-compliance";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { createAdminPrediction } from "@/services/admin-data";
import { predictionWriteSchema, toPredictionWriteInput } from "./schema";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ANALYST")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权创建预测"), { status: 403 });
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

  try {
    const prediction = await createAdminPrediction({
      ...toPredictionWriteInput(parsed.data),
      actor: user,
    });

    return NextResponse.json(ok({ prediction }), { status: 201 });
  } catch (error) {
    console.error("Failed to create prediction", error);
    return NextResponse.json(fail("CREATE_FAILED", "创建预测失败，请确认该赛事尚未有关联预测"), { status: 409 });
  }
}
