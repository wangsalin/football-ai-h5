import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok } from "@/lib/response";
import { setMatchReminder } from "@/services/user-preferences";

const preferenceSchema = z.object({
  matchId: z.string().min(1, "请选择比赛"),
  enabled: z.boolean(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = preferenceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "提醒参数错误", parsed.error.flatten()), { status: 422 });
  }

  try {
    const reminder = await setMatchReminder({
      userId: user.id,
      matchId: parsed.data.matchId,
      enabled: parsed.data.enabled,
    });

    if (reminder === undefined) {
      return NextResponse.json(fail("NOT_FOUND", "比赛不存在"), { status: 404 });
    }

    return NextResponse.json(ok({ enabled: parsed.data.enabled, reminder }));
  } catch (error) {
    console.error("Failed to update match reminder", error);
    return NextResponse.json(fail("UPDATE_FAILED", "提醒更新失败，请稍后重试"), { status: 409 });
  }
}
