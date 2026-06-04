import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Building2, CalendarDays, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LeadForm } from "@/components/h5/lead-form";
import { PageHeader } from "@/components/h5/page-header";
import { AdClickLink } from "@/components/ui/ad-click-link";
import { createConfiguredShareMetadata } from "@/lib/share-metadata";
import { getPublicAdCampaignById } from "@/services/ad-data";

type AdDetailPageProps = {
  params: Promise<{ id: string }>;
};

function isExternalUrl(value?: string | null) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

export async function generateMetadata({ params }: AdDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const campaign = await getPublicAdCampaignById(id);

  if (!campaign) {
    return createConfiguredShareMetadata({
      title: "广告详情",
      description: "查看平台广告内容与合作信息。",
      path: "/ads",
    });
  }

  return createConfiguredShareMetadata({
    title: `${campaign.title} | 广告`,
    description: campaign.body || campaign.description || "查看平台广告内容与合作信息。",
    path: `/ads/${id}`,
  });
}

export const dynamic = "force-dynamic";

export default async function AdDetailPage({ params }: AdDetailPageProps) {
  const { id } = await params;
  const campaign = await getPublicAdCampaignById(id);

  if (!campaign) {
    notFound();
  }

  const hasExternalTarget = isExternalUrl(campaign.targetUrl);

  return (
    <AppShell>
      <PageHeader
        eyebrow={`${campaign.slot} · 广告`}
        title={campaign.title}
        description={campaign.body || "广告内容由商家提供，平台仅展示已审核素材。"}
      />

      <section className="mt-5 overflow-hidden rounded-2xl border border-[#f6c85f]/25 bg-[#0e1f17]">
        {campaign.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={campaign.title} className="aspect-[16/9] w-full object-cover" src={campaign.imageUrl} />
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center bg-[#132d21]">
            <Building2 className="text-[#f6c85f]" size={44} aria-hidden="true" />
          </div>
        )}
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#f6c85f]/40 px-2 py-0.5 text-[11px] font-semibold text-[#f6c85f]">
              广告
            </span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-[#9db4a5]">
              已审核
            </span>
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-normal text-[#eef7ef]">{campaign.title}</h1>
          <p className="mt-3 text-sm leading-6 text-[#c7d7ca]">{campaign.body}</p>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-white/8 bg-[#11281d] p-4">
          <MapPin className="text-[#36d37e]" size={18} aria-hidden="true" />
          <p className="mt-2 text-xs text-[#9db4a5]">商家</p>
          <p className="mt-1 text-base font-semibold text-[#eef7ef]">{campaign.account}</p>
          <p className="mt-1 text-xs text-[#9db4a5]">{campaign.city ?? "本地商家"}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#11281d] p-4">
          <CalendarDays className="text-[#f6c85f]" size={18} aria-hidden="true" />
          <p className="mt-2 text-xs text-[#9db4a5]">投放期</p>
          <p className="mt-1 text-sm font-semibold leading-5 text-[#eef7ef]">
            {campaign.startAt} 至 {campaign.endAt}
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-[#36d37e]" size={18} aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-[#eef7ef]">广告说明</h2>
            <p className="mt-2 text-sm leading-6 text-[#9db4a5]">
              本页为广告内容页。广告内容由商家提供，平台仅展示已审核的本地消费与品牌曝光信息，不展示彩票、博彩或非法金融投放。
            </p>
          </div>
        </div>
      </section>

      {hasExternalTarget ? (
        <AdClickLink
          campaignId={campaign.id}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#36d37e] text-sm font-semibold text-[#07110d]"
          external
          href={campaign.targetUrl!}
          pagePath={`/ads/${campaign.id}`}
        >
          前往商家页面
          <ExternalLink size={16} aria-hidden="true" />
        </AdClickLink>
      ) : null}

      <section className="mt-5 rounded-2xl border border-white/8 bg-[#11281d] p-4">
        <h2 className="text-lg font-semibold text-[#eef7ef]">联系投放或合作</h2>
        <p className="mt-2 text-xs leading-5 text-[#9db4a5]">
          想投放类似广告位，可以提交合作线索，后台会统一处理。
        </p>
        <LeadForm />
      </section>
    </AppShell>
  );
}
