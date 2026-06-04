import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { updateMatchSourceSettings } from "@/services/admin-settings";

const matchSourceSchema = z.object({
  provider: z.enum(["manual", "api", "openai_search"]),
  apiUrl: z.string().trim().optional(),
  searchModel: z.string().trim().optional(),
  searchPromptTemplate: z.string().trim().optional(),
  syncEnabled: z.boolean(),
  syncCron: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ADMIN")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权修改赛事数据源"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = matchSourceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "赛事数据源参数错误", parsed.error.flatten()), { status: 422 });
  }

  const settings = await updateMatchSourceSettings({
    provider: parsed.data.provider,
    apiUrl: parsed.data.apiUrl ?? "",
    searchModel: parsed.data.searchModel ?? "gpt-5.5",
    searchPromptTemplate:
      parsed.data.searchPromptTemplate ??
      "检索未来 72 小时足球赛程，返回联赛、主队、客队、开赛时间、场地和信息来源。只返回可核验的赛事，不要预测。",
    syncEnabled: parsed.data.syncEnabled,
    syncCron: parsed.data.syncCron,
    actor: user,
  });

  return NextResponse.json(ok({ settings }));
}
