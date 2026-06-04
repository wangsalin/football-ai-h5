import { NextResponse } from "next/server";
import { z } from "zod";
import { assertNoSensitiveWords, isSensitiveContentError } from "@/lib/content-compliance";
import { buildRateLimitKey, getClientIp, rateLimit } from "@/lib/rate-limit";
import { fail, ok } from "@/lib/response";
import { saveLeadForm } from "@/services/ad-data";

const leadSchema = z.object({
  companyName: z.string().min(1, "请输入品牌名"),
  contactName: z.string().min(1, "请输入联系人"),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入正确的手机号"),
  city: z.string().optional(),
  budget: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "线索参数错误", parsed.error.flatten()), {
      status: 422,
    });
  }

  const [phoneLimit, ipLimit] = await Promise.all([
    rateLimit({ key: `rl:lead:phone:${buildRateLimitKey([parsed.data.phone])}`, limit: 3, windowSeconds: 60 * 60 }),
    rateLimit({ key: `rl:lead:ip:${buildRateLimitKey([getClientIp(request)])}`, limit: 20, windowSeconds: 60 * 60 }),
  ]);

  if (!phoneLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json(fail("RATE_LIMITED", "线索提交过于频繁，请稍后再试"), { status: 429 });
  }

  try {
    assertNoSensitiveWords([
      parsed.data.companyName,
      parsed.data.contactName,
      parsed.data.city,
      parsed.data.budget,
      parsed.data.message,
    ]);
  } catch (error) {
    if (isSensitiveContentError(error)) {
      return NextResponse.json(fail("SENSITIVE_WORD_DETECTED", `广告合作信息包含敏感词：${error.words.join("、")}`), {
        status: 422,
      });
    }

    throw error;
  }

  const lead = await saveLeadForm(parsed.data);

  return NextResponse.json(ok({ saved: true, lead }), { status: 201 });
}
