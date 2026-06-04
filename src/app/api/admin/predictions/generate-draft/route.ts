import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok } from "@/lib/response";
import { hasRole } from "@/lib/permissions";
import { getLlmProvider } from "@/adapters/llm";
import { validateCompliantAnalysis } from "@/services/analysis/guardrails";
import { aiAnalysisInputSchema, aiAnalysisOutputSchema } from "@/services/analysis/schema";
import { getAiSettings } from "@/services/admin-settings";

function serializeAiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer ***").slice(0, 500);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ANALYST")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权生成预测草稿"), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const input = aiAnalysisInputSchema.safeParse(body);

  if (!input.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "AI 输入数据不完整", input.error.flatten()), {
      status: 422,
    });
  }

  const settings = await getAiSettings();
  let draft: unknown;

  try {
    draft = await getLlmProvider(settings).generatePredictionDraft(input.data, settings);
  } catch (error) {
    console.error("AI draft generation failed", error);
    return NextResponse.json(
      fail("AI_PROVIDER_ERROR", "AI 服务调用失败，请检查模型、API 地址和 API Key 设置", {
        provider: settings.provider,
        model: settings.model,
        apiBaseUrl: settings.apiBaseUrl,
        reason: serializeAiError(error),
      }),
      {
        status: 502,
      },
    );
  }

  const output = aiAnalysisOutputSchema.safeParse(draft);

  if (!output.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "AI 输出结构不符合要求", output.error.flatten()), {
      status: 422,
    });
  }

  const compliance = validateCompliantAnalysis(output.data);

  if (!compliance.ok) {
    return NextResponse.json(
      fail("SENSITIVE_WORD_DETECTED", "内容包含不合规表达，请修改后再保存。", {
        words: compliance.words,
      }),
      { status: 422 },
    );
  }

  return NextResponse.json(
    ok({
      draft: output.data,
      status: "DRAFT",
      saved: false,
      provider: settings.provider,
      model: settings.model,
    }),
  );
}
