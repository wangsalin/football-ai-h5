import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";
import { updateAiSettings } from "@/services/admin-settings";

const aiSettingsSchema = z.object({
  provider: z.enum(["mock", "openai"]),
  apiBaseUrl: z.string().trim().url(),
  apiKey: z.string().optional().default(""),
  apiKeySet: z.boolean().optional().default(false),
  model: z.string().trim().min(1),
  temperature: z.number().min(0).max(2),
  webSearchEnabled: z.boolean().default(false),
  systemPrompt: z.string().trim().min(20),
  userPromptTemplate: z.string().trim().min(20),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ADMIN")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权修改模型设置"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = aiSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "模型设置参数错误", parsed.error.flatten()), { status: 422 });
  }

  const settings = await updateAiSettings({ ...parsed.data, actor: user });

  return NextResponse.json(ok({ settings }));
}
