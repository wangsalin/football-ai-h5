import { AdBannerCarousel } from "@/components/ui/ad-banner-carousel";
import { getActiveAdCampaigns, type PublicAdCampaign } from "@/services/ad-data";

type AdSlotProps = {
  title: string;
  body: string;
  campaignId?: string;
  slotCode?: string;
  href?: string;
};

export async function AdSlot({ title, body, campaignId = "fallback_ad", slotCode = "HOME_TOP", href = "/ads" }: AdSlotProps) {
  const campaigns = await getActiveAdCampaigns(slotCode, 5);
  const fallback: PublicAdCampaign = {
    id: campaignId,
    accountId: "fallback",
    account: "品牌广告",
    slotCode,
    slot: "广告位",
    title,
    body,
    imageUrl: undefined,
    targetUrl: href,
    status: "APPROVED",
    startAt: "",
    endAt: "",
  };

  return <AdBannerCarousel campaigns={campaigns} fallback={fallback} slotCode={slotCode} />;
}
