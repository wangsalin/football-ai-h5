import type { LlmProvider } from "@/adapters/llm/provider.interface";
import { footballReviewSystemPrompt, footballReviewUserPromptTemplate } from "@/services/ai-prompts";
import type { AiAnalysisInput, AiAnalysisOutput } from "@/services/analysis/schema";
import { aiAnalysisOutputSchema, aiAnalysisSectionKeys } from "@/services/analysis/schema";

const sectionTitleByKey: Record<(typeof aiAnalysisSectionKeys)[number], string> = {
  overview: "赛事背景",
  strength: "实力定位",
  form: "近期状态",
  motivation: "战意动机",
  schedule: "赛程体能",
  lineup: "伤停阵容",
  tactics: "战术对位",
  homeAway: "主客场因素",
  h2h: "历史交锋",
  odds: "赔率指数",
  tempo: "节奏比分",
  risk: "冷门风险",
};

type ResponsesApiOutput = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type ChatCompletionsOutput = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function buildResponsesEndpoint(apiBaseUrl: string) {
  return `${apiBaseUrl.replace(/\/+$/, "")}/responses`;
}

function buildChatCompletionsEndpoint(apiBaseUrl: string) {
  return `${apiBaseUrl.replace(/\/+$/, "")}/chat/completions`;
}

function prefersChatCompletions(model: string) {
  return model.toLowerCase().includes("gemini");
}

function buildUserPrompt(input: AiAnalysisInput, template: string) {
  return `${template}

赛事输入：
${JSON.stringify(input, null, 2)}

输出要求：
- 只返回 JSON，不要 Markdown，不要解释。
- JSON 必须符合字段：summary, winDrawLossPick, handicapPick, scorePicks, totalGoalsPick, halfFullPick, riskLevel, confidence, coldAlertReason, sections。
- scorePicks 必须正好 3 个。
- sections 必须正好 ${aiAnalysisSectionKeys.length} 个，sectionKey 依次为 ${aiAnalysisSectionKeys.join("、")}。
- 每个 section 都必须是具体分析，不得只写“信息不足”；信息不足时也要说明缺口如何影响结论。
- confidence 最大 8.5。
- 不得出现保证命中、稳赚、包红、跟单等违规表达。`;
}

function extractText(response: ResponsesApiOutput) {
  if (response.output_text) {
    return response.output_text;
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n") ?? ""
  );
}

function extractChatText(response: ChatCompletionsOutput) {
  return response.choices?.map((choice) => choice.message?.content).filter(Boolean).join("\n") ?? "";
}

function stripJsonFence(text: string) {
  return text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
}

function parseJsonOutput(text: string): AiAnalysisOutput {
  const parsed = JSON.parse(stripJsonFence(text)) as unknown;
  if (parsed && typeof parsed === "object" && Array.isArray((parsed as { sections?: unknown }).sections)) {
    const candidate = parsed as {
      sections: Array<{ sectionKey?: (typeof aiAnalysisSectionKeys)[number]; title?: string; content?: string }>;
    };
    candidate.sections = candidate.sections.map((section, index) => {
      const sectionKey = section.sectionKey ?? aiAnalysisSectionKeys[index];
      return {
        ...section,
        sectionKey,
        title: section.title || sectionTitleByKey[sectionKey],
      };
    });
  }

  return aiAnalysisOutputSchema.parse(parsed);
}

async function postJsonWithRetry(endpoint: string, apiKey: string, body: unknown) {
  let lastErrorText = "";

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return response;
    }

    lastErrorText = `${response.status} ${(await response.text().catch(() => "")).slice(0, 300)}`;
    if (response.status !== 429 && response.status < 500) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
  }

  throw new Error(`OpenAI request failed: ${lastErrorText}`);
}

async function generateText(settings: NonNullable<Parameters<LlmProvider["generatePredictionDraft"]>[1]>, apiKey: string, systemPrompt: string, userPrompt: string) {
  if (!prefersChatCompletions(settings.model)) {
    try {
      const response = await postJsonWithRetry(buildResponsesEndpoint(settings.apiBaseUrl), apiKey, {
        model: settings.model,
        temperature: settings.temperature,
        instructions: systemPrompt,
        input: userPrompt,
        tools: settings.webSearchEnabled ? [{ type: "web_search" }] : [],
        tool_choice: settings.webSearchEnabled ? "auto" : undefined,
      });

      return extractText((await response.json()) as ResponsesApiOutput);
    } catch (error) {
      console.error("Responses API failed, falling back to Chat Completions", error);
    }
  }

  const response = await postJsonWithRetry(buildChatCompletionsEndpoint(settings.apiBaseUrl), apiKey, {
    model: settings.model,
    temperature: settings.temperature,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return extractChatText((await response.json()) as ChatCompletionsOutput);
}

export const openaiProvider: LlmProvider = {
  async generatePredictionDraft(input, settings) {
    if (!settings) {
      throw new Error("OpenAI settings are required.");
    }

    const apiKey = settings.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API Key is not configured.");
    }

    const text = await generateText(settings, apiKey, settings.systemPrompt, buildUserPrompt(input, settings.userPromptTemplate));
    return parseJsonOutput(text);
  },

  async generateReviewDraft(input, settings) {
    if (!settings) {
      throw new Error("OpenAI settings are required.");
    }

    const apiKey = settings.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API Key is not configured.");
    }

    const text = await generateText(
      settings,
      apiKey,
      footballReviewSystemPrompt,
      `${footballReviewUserPromptTemplate}

比赛输入：
${JSON.stringify(input, null, 2)}`,
    );

    const parsed = JSON.parse(stripJsonFence(text)) as {
      resultType?: "HIT" | "MISS" | "PARTIAL";
      hitSummary?: string;
      missReason?: string;
      correctionNote?: string;
    };

    return {
      resultType: parsed.resultType ?? "PARTIAL",
      hitSummary: parsed.hitSummary ?? "自动复盘已生成，需要人工补充关键赛中事件。",
      missReason: parsed.missReason,
      correctionNote: parsed.correctionNote,
    };
  },
};
