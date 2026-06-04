import { NextResponse } from "next/server";
import { z } from "zod";
import { buildRateLimitKey, getClientIp, rateLimit } from "@/lib/rate-limit";
import { fail, ok } from "@/lib/response";
import { recordAdEvent } from "@/services/ad-data";

const adEventSchema = z.object({
  campaignId: z.string().min(1),
  eventType: z.enum(["IMPRESSION", "CLICK"]),
  pagePath: z.string().optional(),
});

export async function POST(request: Request) {
  const ipLimit = await rateLimit({
    key: `rl:ad-event:ip:${buildRateLimitKey([getClientIp(request)])}`,
    limit: 300,
    windowSeconds: 60,
  });

  if (!ipLimit.allowed) {
    return NextResponse.json(fail("RATE_LIMITED", "广告事件提交过于频繁"), { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_ERROR", "广告事件参数错误", parsed.error.flatten()), {
      status: 422,
    });
  }

  const campaignLimit = await rateLimit({
    key: `rl:ad-event:campaign:${buildRateLimitKey([parsed.data.campaignId, getClientIp(request)])}`,
    limit: 120,
    windowSeconds: 60,
  });

  if (!campaignLimit.allowed) {
    return NextResponse.json(fail("RATE_LIMITED", "广告事件提交过于频繁"), { status: 429 });
  }

  const result = await recordAdEvent(parsed.data, request);

  if (!result.accepted) {
    return NextResponse.json(fail("CAMPAIGN_NOT_FOUND", "广告计划不存在"), { status: 404 });
  }

  return NextResponse.json(ok(result));
}
