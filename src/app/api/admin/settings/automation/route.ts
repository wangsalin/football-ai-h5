import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { updateAutomationSettings } from "@/services/admin-settings";

const automationSchema = z.object({
  predictionEnabled: z.boolean(),
  predictionRunAt: z.string().regex(/^\d{2}:\d{2}$/),
  predictionLookaheadHours: z.number().min(1).max(168),
  predictionStatus: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED"]),
  prematchReanalysisEnabled: z.boolean(),
  prematchReanalysisMinutesBefore: z.number().min(5).max(180),
  prematchReanalysisWindowMinutes: z.number().min(1).max(30),
  prematchReanalysisStatus: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED"]),
  reviewEnabled: z.boolean(),
  reviewRunAt: z.string().regex(/^\d{2}:\d{2}$/),
  reviewDelayHours: z.number().min(0).max(168),
  reviewStatus: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED"]),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ADMIN")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权修改自动任务设置"), { status: 403 });
  }

  const parsed = automationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "自动任务设置参数错误", parsed.error.flatten()), { status: 422 });
  }

  return NextResponse.json(ok({ settings: await updateAutomationSettings({ ...parsed.data, actor: user }) }));
}
