import { NextResponse } from "next/server";
import { ok } from "@/lib/response";
import { getActiveAdCampaign } from "@/services/ad-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slotCode = url.searchParams.get("slotCode");
  const campaign = await getActiveAdCampaign(slotCode);

  return NextResponse.json(ok({ campaign: campaign ?? null }));
}
