import { createHash } from "node:crypto";
import { AdSlotCode } from "@prisma/client";
import { advertiserLeads, adminAds, getAdvertiserCampaigns } from "@/lib/admin-mock";
import { prisma } from "@/lib/db";

type AdEventInput = {
  campaignId: string;
  eventType: "IMPRESSION" | "CLICK";
  pagePath?: string;
};

type LeadInput = {
  companyName: string;
  contactName: string;
  phone: string;
  city?: string;
  budget?: string;
  message?: string;
};

export type PublicAdCampaign = {
  id: string;
  accountId: string;
  account: string;
  slotCode: string;
  slot: string;
  title: string;
  body: string;
  imageUrl?: string;
  targetUrl?: string;
  status: string;
  startAt: string;
  endAt: string;
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatAdSlotName(code: AdSlotCode | string, name: string) {
  if (code === "HOME_TOP") {
    return "首页轮播 Banner";
  }

  return name;
}

function hashHeader(value: string | null) {
  if (!value) {
    return undefined;
  }

  return createHash("sha256").update(value).digest("hex");
}

function isAdSlotCode(value: string | null): value is AdSlotCode {
  return Boolean(value && Object.values(AdSlotCode).includes(value as AdSlotCode));
}

function mapCampaign(campaign: Awaited<ReturnType<typeof prisma.adCampaign.findFirst>> & {
  account: { companyName: string };
  slot: { code: AdSlotCode; name: string };
  creatives: Array<{ title: string; body: string | null; imageUrl: string | null }>;
}): PublicAdCampaign {
  const creative = campaign.creatives[0];

  return {
    id: campaign.id,
    accountId: campaign.accountId,
    account: campaign.account.companyName,
    slotCode: campaign.slot.code,
    slot: formatAdSlotName(campaign.slot.code, campaign.slot.name),
    title: creative?.title ?? campaign.title,
    body: creative?.body ?? campaign.description ?? "查看商家广告详情。",
    imageUrl: creative?.imageUrl ?? undefined,
    targetUrl: campaign.targetUrl ?? undefined,
    status: campaign.status,
    startAt: formatDate(campaign.startAt),
    endAt: formatDate(campaign.endAt),
  };
}

function mapFallbackCampaign(campaign: (typeof adminAds)[number]): PublicAdCampaign {
  return {
    id: campaign.id,
    accountId: campaign.accountId,
    account: campaign.account,
    slotCode: campaign.slotCode,
    slot: formatAdSlotName(campaign.slotCode, campaign.slot),
    title: campaign.title,
    body: "本地看球消费广告，已标记广告。",
    imageUrl: undefined,
    targetUrl: "/ads",
    status: campaign.status,
    startAt: campaign.startAt,
    endAt: campaign.endAt,
  };
}

export async function getActiveAdCampaigns(slotCode: string | null, limit = 5): Promise<PublicAdCampaign[]> {
  try {
    const now = new Date();
    const campaigns = await prisma.adCampaign.findMany({
      where: {
        status: "APPROVED",
        startAt: { lte: now },
        endAt: { gte: now },
        slot: {
          enabled: true,
          ...(isAdSlotCode(slotCode) ? { code: slotCode } : {}),
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        account: true,
        creatives: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        slot: true,
      },
    });

    return campaigns.map((campaign) => mapCampaign(campaign));
  } catch (error) {
    console.error("Failed to read active ad campaigns from Prisma", error);
    return adminAds
      .filter((item) => item.status === "APPROVED")
      .filter((item) => !slotCode || item.slotCode === slotCode)
      .slice(0, limit)
      .map(mapFallbackCampaign);
  }
}

export async function getActiveAdCampaign(slotCode: string | null) {
  try {
    const now = new Date();
    const campaign = await prisma.adCampaign.findFirst({
      where: {
        status: "APPROVED",
        startAt: { lte: now },
        endAt: { gte: now },
        slot: {
          enabled: true,
          ...(isAdSlotCode(slotCode) ? { code: slotCode } : {}),
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        account: true,
        creatives: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        slot: true,
      },
    });

    if (!campaign) {
      return null;
    }

    return mapCampaign(campaign);
  } catch (error) {
    console.error("Failed to read active ad campaign from Prisma", error);
    const fallback = adminAds
      .filter((item) => item.status === "APPROVED")
      .find((item) => !slotCode || item.slotCode === slotCode);

    if (!fallback) {
      return null;
    }

    return mapFallbackCampaign(fallback);
  }
}

export async function getPublicAdCampaignById(id: string) {
  try {
    const now = new Date();
    const campaign = await prisma.adCampaign.findFirst({
      where: {
        id,
        status: "APPROVED",
        startAt: { lte: now },
        endAt: { gte: now },
        slot: { enabled: true },
      },
      include: {
        account: true,
        creatives: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        slot: true,
      },
    });

    if (!campaign) {
      return null;
    }

    const creative = campaign.creatives[0];

    return {
      id: campaign.id,
      accountId: campaign.accountId,
      account: campaign.account.companyName,
      contactName: campaign.account.contactName,
      city: campaign.account.city,
      phone: campaign.account.phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2"),
      slotCode: campaign.slot.code,
      slot: formatAdSlotName(campaign.slot.code, campaign.slot.name),
      title: creative?.title ?? campaign.title,
      body: creative?.body ?? campaign.description ?? "",
      imageUrl: creative?.imageUrl,
      targetUrl: campaign.targetUrl,
      description: campaign.description ?? "",
      startAt: formatDate(campaign.startAt),
      endAt: formatDate(campaign.endAt),
    };
  } catch (error) {
    console.error("Failed to read public ad campaign from Prisma", error);
    const campaign = adminAds.find((item) => item.id === id && item.status === "APPROVED");

    if (!campaign) {
      return null;
    }

    return {
      id: campaign.id,
      accountId: campaign.accountId,
      account: campaign.account,
      contactName: "商务联系人",
      city: "本地",
      phone: "请提交合作线索",
      slotCode: campaign.slotCode,
      slot: formatAdSlotName(campaign.slotCode, campaign.slot),
      title: campaign.title,
      body: "本地看球消费广告，已标记广告。",
      imageUrl: undefined,
      targetUrl: "/ads",
      description: "本地看球消费广告，已标记广告。",
      startAt: campaign.startAt,
      endAt: campaign.endAt,
    };
  }
}

export async function recordAdEvent(input: AdEventInput, request: Request) {
  try {
    const campaign = await prisma.adCampaign.findUnique({
      where: { id: input.campaignId },
      select: { id: true },
    });

    if (!campaign) {
      return { accepted: false, saved: false, reason: "CAMPAIGN_NOT_FOUND" as const };
    }

    const event = await prisma.adEvent.create({
      data: {
        campaignId: input.campaignId,
        eventType: input.eventType,
        pagePath: input.pagePath,
        ipHash: hashHeader(request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip")),
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    });

    return {
      accepted: true,
      saved: true,
      event: {
        id: event.id,
        campaignId: event.campaignId,
        eventType: event.eventType,
        pagePath: event.pagePath,
        createdAt: event.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Failed to record ad event in Prisma", error);
    const mockCampaign = adminAds.find((item) => item.id === input.campaignId);

    return {
      accepted: Boolean(mockCampaign),
      saved: false,
      event: input,
      reason: mockCampaign ? "MOCK_FALLBACK" : "CAMPAIGN_NOT_FOUND",
    };
  }
}

export async function saveLeadForm(input: LeadInput) {
  const lead = await prisma.leadForm.create({
    data: input,
  });

  return {
    id: lead.id,
    companyName: lead.companyName,
    contactName: lead.contactName,
    phone: lead.phone,
    city: lead.city,
    budget: lead.budget,
    message: lead.message,
    status: lead.status,
    createdAt: lead.createdAt.toISOString(),
  };
}

export async function getAdvertiserDashboardData(user: { id: string; phone?: string }) {
  try {
    const account = await prisma.adAccount.findFirst({
      where: { userId: user.id },
      include: {
        campaigns: {
          orderBy: { createdAt: "desc" },
          include: { slot: true },
        },
      },
    });

    const campaigns = await Promise.all(
      (account?.campaigns ?? []).map(async (campaign) => {
        const [impressions, clicks] = await Promise.all([
          prisma.adEvent.count({ where: { campaignId: campaign.id, eventType: "IMPRESSION" } }),
          prisma.adEvent.count({ where: { campaignId: campaign.id, eventType: "CLICK" } }),
        ]);

        return {
          id: campaign.id,
          title: campaign.title,
          slot: formatAdSlotName(campaign.slot.code, campaign.slot.name),
          status: campaign.status,
          startAt: formatDate(campaign.startAt),
          endAt: formatDate(campaign.endAt),
          impressions,
          clicks,
          leads: 0,
        };
      }),
    );

    const [totalLeads, leads] = await Promise.all([
      prisma.leadForm.count(),
      prisma.leadForm.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      campaigns,
      totalImpressions: campaigns.reduce((sum, item) => sum + item.impressions, 0),
      totalClicks: campaigns.reduce((sum, item) => sum + item.clicks, 0),
      totalLeads,
      leads: leads.map((lead) => ({
        id: lead.id,
        companyName: lead.companyName,
        contactName: lead.contactName,
        phone: lead.phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2"),
        city: lead.city ?? "-",
        source: lead.message ?? "广告合作页",
        createdAt: lead.createdAt.toISOString().slice(0, 16).replace("T", " "),
      })),
    };
  } catch (error) {
    console.error("Failed to read advertiser dashboard from Prisma", error);
    const campaigns = getAdvertiserCampaigns(user.id, user.phone);
    const totalImpressions = campaigns.reduce((sum, item) => sum + item.impressions, 0);
    const totalClicks = campaigns.reduce((sum, item) => sum + item.clicks, 0);

    return {
      campaigns,
      totalImpressions,
      totalClicks,
      totalLeads: campaigns.reduce((sum, item) => sum + item.leads, 0),
      leads: advertiserLeads,
    };
  }
}
