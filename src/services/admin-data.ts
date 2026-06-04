import { adminAds, adminMatches, adminPredictions, adminReviews, adminStats, adminUsers } from "@/lib/admin-mock";
import type { AppUser } from "@/lib/auth";
import { hashValue, maskPhone } from "@/lib/auth";
import { assertNoSensitiveWords } from "@/lib/content-compliance";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function formatDateTime(date: Date | null | undefined) {
  if (!date) {
    return "-";
  }

  return date.toISOString().slice(0, 16).replace("T", " ");
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTime(date: Date) {
  return date.toISOString().slice(11, 16);
}

function toAuditJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeMatchSource(source: string | null | undefined): "manual" | "china_sports_lottery" {
  return source === "china_sports_lottery" ? "china_sports_lottery" : "manual";
}

function formatAdminAdSlotName(code: string, name: string) {
  if (code === "HOME_TOP") {
    return "首页轮播 Banner";
  }

  return name;
}

type MatchWriteInput = {
  competitionName: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: Date;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";
  venue?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  source?: string;
};

type PredictionWriteInput = {
  matchId: string;
  summary: string;
  winDrawLossPick: string;
  handicapPick?: string;
  scorePicks: string[];
  totalGoalsPick?: string;
  halfFullPick?: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  coldAlertReason?: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "OFFLINE";
  sections?: Array<{
    sectionKey: string;
    title: string;
    content: string;
  }>;
};

type ReviewWriteInput = {
  matchId: string;
  predictionId?: string;
  actualResult: string;
  resultType: "HIT" | "MISS" | "PARTIAL";
  hitSummary: string;
  missReason?: string;
  correctionNote?: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "OFFLINE";
};

type UserWriteInput = {
  phone?: string;
  nickname?: string;
  role: "USER" | "ADVERTISER" | "ANALYST" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "DISABLED";
};

type AdminAccountWriteInput = {
  username: string;
  nickname?: string;
  phone?: string;
  password?: string;
  role: "ANALYST" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "DISABLED";
};

type AdCampaignWriteInput = {
  accountId: string;
  slotId: string;
  title: string;
  description?: string;
  targetUrl?: string;
  priority: number;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "PAUSED";
  startAt: Date;
  endAt: Date;
  creativeTitle: string;
  creativeBody?: string;
  imageUrl?: string;
};

async function findOrCreateCompetition(tx: Prisma.TransactionClient, name: string) {
  const existing = await tx.competition.findFirst({ where: { name } });
  if (existing) {
    return existing;
  }

  return tx.competition.create({ data: { name } });
}

async function findOrCreateTeam(tx: Prisma.TransactionClient, name: string) {
  const existing = await tx.team.findFirst({ where: { name } });
  if (existing) {
    return existing;
  }

  return tx.team.create({ data: { name, shortName: name.slice(0, 3) } });
}

export async function getAdminStats() {
  try {
    const now = new Date();
    const [todayMatches, pendingPredictions, users, impressions, clicks] = await Promise.all([
      prisma.match.count({ where: { kickoffAt: { gte: startOfDay(now), lte: endOfDay(now) } } }),
      prisma.prediction.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.user.count(),
      prisma.adEvent.count({
        where: { eventType: "IMPRESSION", createdAt: { gte: startOfDay(now), lte: endOfDay(now) } },
      }),
      prisma.adEvent.count({ where: { eventType: "CLICK", createdAt: { gte: startOfDay(now), lte: endOfDay(now) } } }),
    ]);

    return [
      { label: "今日比赛", value: `${todayMatches}`, hint: "来自 Prisma Match" },
      { label: "待审核预测", value: `${pendingPredictions}`, hint: "PENDING_REVIEW" },
      { label: "用户数", value: `${users}`, hint: "含广告主和分析师" },
      { label: "今日曝光", value: `${impressions}`, hint: `点击 ${clicks} 次` },
    ];
  } catch (error) {
    console.error("Failed to read admin stats from Prisma", error);
    return adminStats;
  }
}

export async function getAdminUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { favorites: true },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      phone: user.phone ? maskPhone(user.phone) : "-",
      rawPhone: user.phone ?? "",
      nickname: user.nickname ?? "-",
      role: user.role,
      status: user.status,
      favorites: user._count.favorites,
      lastLoginAt: formatDateTime(user.lastLoginAt),
    }));
  } catch (error) {
    console.error("Failed to read admin users from Prisma", error);
    return adminUsers.map((user) => ({
      ...user,
      phone: maskPhone(user.phone),
      rawPhone: user.phone,
    }));
  }
}

export async function getAdminAccounts() {
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["ANALYST", "ADMIN", "SUPER_ADMIN"] },
    },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      username: true,
      phone: true,
      nickname: true,
      role: true,
      status: true,
      lastLoginAt: true,
      updatedAt: true,
      passwordHash: true,
    },
  });

  return users.map((user) => ({
    id: user.id,
    username: user.username ?? "",
    phone: user.phone ? maskPhone(user.phone) : "-",
    rawPhone: user.phone ?? "",
    nickname: user.nickname ?? "-",
    role: user.role as "ANALYST" | "ADMIN" | "SUPER_ADMIN",
    status: user.status as "ACTIVE" | "DISABLED",
    passwordSet: Boolean(user.passwordHash),
    lastLoginAt: formatDateTime(user.lastLoginAt),
    updatedAt: formatDateTime(user.updatedAt),
  }));
}

export async function getAdminMatches() {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { kickoffAt: "asc" },
      include: {
        awayTeam: true,
        competition: true,
        homeTeam: true,
      },
    });

    return matches.map((match) => ({
      id: match.id,
      title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      competition: match.competition.name,
      competitionName: match.competition.name,
      homeTeamName: match.homeTeam.name,
      awayTeamName: match.awayTeam.name,
      kickoffAt: `${formatDate(match.kickoffAt)} ${formatTime(match.kickoffAt)}`,
      kickoffInput: match.kickoffAt.toISOString().slice(0, 16),
      status: match.status,
      venue: match.venue ?? "",
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      source: normalizeMatchSource(match.source),
    }));
  } catch (error) {
    console.error("Failed to read admin matches from Prisma", error);
    return adminMatches.map((match) => ({
      id: match.id,
      title: `${match.homeTeam} vs ${match.awayTeam}`,
      competition: match.competition,
      competitionName: match.competition,
      homeTeamName: match.homeTeam,
      awayTeamName: match.awayTeam,
      kickoffAt: `${match.date} ${match.kickoffTime}`,
      kickoffInput: `${match.date}T${match.kickoffTime}`,
      status: match.status,
      venue: "",
      homeScore: null,
      awayScore: null,
      source: normalizeMatchSource(match.source),
    }));
  }
}

export async function getAdminPredictions() {
  try {
    const predictions = await prisma.prediction.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        match: {
          include: {
            awayTeam: true,
            homeTeam: true,
          },
        },
      },
    });

    return predictions.map((prediction) => ({
      id: prediction.id,
      matchId: prediction.matchId,
      matchTitle: `${prediction.match.homeTeam.name} vs ${prediction.match.awayTeam.name}`,
      summary: prediction.summary,
      winDrawLossPick: prediction.winDrawLossPick,
      handicapPick: prediction.handicapPick ?? "",
      scorePicks: prediction.scorePicks,
      totalGoalsPick: prediction.totalGoalsPick ?? "",
      halfFullPick: prediction.halfFullPick ?? "",
      riskLevel: prediction.riskLevel,
      confidence: prediction.confidence,
      coldAlertReason: prediction.coldAlertReason ?? "",
      status: prediction.status,
      author: "系统",
      updatedAt: formatDateTime(prediction.updatedAt),
    }));
  } catch (error) {
    console.error("Failed to read admin predictions from Prisma", error);
    return adminPredictions.map((prediction) => ({
      id: prediction.id,
      matchId: prediction.match.id,
      matchTitle: `${prediction.match.homeTeam} vs ${prediction.match.awayTeam}`,
      summary: prediction.match.summary,
      winDrawLossPick: prediction.match.winDrawLossPick,
      handicapPick: "",
      scorePicks: prediction.match.scorePicks,
      totalGoalsPick: "",
      halfFullPick: "",
      riskLevel: prediction.match.riskLevel,
      confidence: prediction.match.confidence,
      coldAlertReason: "",
      status: prediction.status,
      author: prediction.author,
      updatedAt: prediction.updatedAt,
    }));
  }
}

export async function getAdminAds() {
  try {
    const campaigns = await prisma.adCampaign.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        account: true,
        slot: true,
        creatives: { orderBy: { createdAt: "asc" }, take: 1 },
      },
    });

    return Promise.all(
      campaigns.map(async (campaign) => {
        const [impressions, clicks] = await Promise.all([
          prisma.adEvent.count({ where: { campaignId: campaign.id, eventType: "IMPRESSION" } }),
          prisma.adEvent.count({ where: { campaignId: campaign.id, eventType: "CLICK" } }),
        ]);

        return {
          id: campaign.id,
          accountId: campaign.accountId,
          account: campaign.account.companyName,
          slotId: campaign.slotId,
          slot: formatAdminAdSlotName(campaign.slot.code, campaign.slot.name),
          title: campaign.title,
          description: campaign.description ?? "",
          targetUrl: campaign.targetUrl ?? "",
          priority: campaign.priority,
          status: campaign.status,
          startInput: campaign.startAt.toISOString().slice(0, 16),
          endInput: campaign.endAt.toISOString().slice(0, 16),
          creativeTitle: campaign.creatives[0]?.title ?? campaign.title,
          creativeBody: campaign.creatives[0]?.body ?? "",
          imageUrl: campaign.creatives[0]?.imageUrl ?? "",
          impressions,
          clicks,
        };
      }),
    );
  } catch (error) {
    console.error("Failed to read admin ads from Prisma", error);
    return adminAds.map((ad) => ({
      ...ad,
      slotId: ad.slotCode,
      description: "",
      targetUrl: "",
      priority: 0,
      startInput: `${ad.startAt}T00:00`,
      endInput: `${ad.endAt}T23:59`,
      creativeTitle: ad.title,
      creativeBody: "",
      imageUrl: "",
    }));
  }
}

export async function getAdminAdOptions() {
  try {
    const [accounts, slots] = await Promise.all([
      prisma.adAccount.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.adSlot.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    return {
      accounts: accounts.map((account) => ({
        id: account.id,
        label: account.companyName,
      })),
      slots: slots.map((slot) => ({
        id: slot.id,
        code: slot.code,
        label: formatAdminAdSlotName(slot.code, slot.name),
      })),
    };
  } catch (error) {
    console.error("Failed to read ad options from Prisma", error);
    return {
      accounts: [],
      slots: [],
    };
  }
}

export async function getAdminReviews() {
  try {
    const reviews = await prisma.matchReview.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        match: {
          include: {
            awayTeam: true,
            homeTeam: true,
          },
        },
      },
    });

    return reviews.map((review) => ({
      id: review.id,
      matchId: review.matchId,
      predictionId: review.predictionId ?? "",
      teams: `${review.match.homeTeam.name} vs ${review.match.awayTeam.name}`,
      actualResult: review.actualResult,
      resultType: review.resultType,
      hitSummary: review.hitSummary,
      missReason: review.missReason ?? "无",
      correctionNote: review.correctionNote ?? "",
      status: review.status,
    }));
  } catch (error) {
    console.error("Failed to read admin reviews from Prisma", error);
    return adminReviews.map((review) => ({
      ...review,
      matchId: review.id,
      predictionId: "",
      hitSummary: review.actualResult,
      missReason: review.missReason ?? "",
      correctionNote: "",
    }));
  }
}

export async function updatePredictionStatus(input: {
  predictionId: string;
  status: "PUBLISHED" | "OFFLINE";
  actor: AppUser;
}) {
  const previous = await prisma.prediction.findUnique({
    where: { id: input.predictionId },
    select: {
      id: true,
      status: true,
      publishedAt: true,
    },
  });

  if (!previous) {
    return null;
  }

  const nextPublishedAt =
    input.status === "PUBLISHED" ? (previous.publishedAt ?? new Date()) : previous.publishedAt;

  const updated = await prisma.$transaction(async (tx) => {
    const prediction = await tx.prediction.update({
      where: { id: input.predictionId },
      data: {
        status: input.status,
        publishedAt: nextPublishedAt,
      },
      select: {
        id: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorRole: input.actor.role,
        action: input.status === "PUBLISHED" ? "PUBLISH_PREDICTION" : "OFFLINE_PREDICTION",
        entityType: "Prediction",
        entityId: input.predictionId,
        beforeJson: toAuditJson(previous),
        afterJson: toAuditJson(prediction),
      },
    });

    return prediction;
  });

  return {
    id: updated.id,
    status: updated.status,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function updateAdCampaignStatus(input: {
  campaignId: string;
  status: "APPROVED" | "REJECTED";
  actor: AppUser;
  rejectReason?: string;
}) {
  const previous = await prisma.adCampaign.findUnique({
    where: { id: input.campaignId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      updatedAt: true,
      creatives: {
        select: {
          id: true,
          title: true,
          body: true,
          status: true,
          rejectReason: true,
        },
      },
    },
  });

  if (!previous) {
    return null;
  }

  if (input.status === "APPROVED") {
    assertNoSensitiveWords([
      previous.title,
      previous.description,
      ...previous.creatives.flatMap((creative) => [creative.title, creative.body]),
    ]);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const campaign = await tx.adCampaign.update({
      where: { id: input.campaignId },
      data: { status: input.status },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    await tx.adCreative.updateMany({
      where: { campaignId: input.campaignId },
      data: {
        status: input.status,
        rejectReason: input.status === "REJECTED" ? (input.rejectReason ?? "广告审核未通过") : null,
      },
    });

    const after = await tx.adCampaign.findUnique({
      where: { id: input.campaignId },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        creatives: {
          select: {
            id: true,
            status: true,
            rejectReason: true,
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorRole: input.actor.role,
        action: input.status === "APPROVED" ? "APPROVE_AD_CAMPAIGN" : "REJECT_AD_CAMPAIGN",
        entityType: "AdCampaign",
        entityId: input.campaignId,
        beforeJson: toAuditJson(previous),
        afterJson: after ? toAuditJson(after) : undefined,
      },
    });

    return campaign;
  });

  return {
    id: updated.id,
    status: updated.status,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function updateReviewStatus(input: {
  reviewId: string;
  status: "PUBLISHED" | "OFFLINE";
  actor: AppUser;
}) {
  const previous = await prisma.matchReview.findUnique({
    where: { id: input.reviewId },
    select: {
      id: true,
      status: true,
      publishedAt: true,
    },
  });

  if (!previous) {
    return null;
  }

  const nextPublishedAt = input.status === "PUBLISHED" ? (previous.publishedAt ?? new Date()) : previous.publishedAt;

  const updated = await prisma.$transaction(async (tx) => {
    const review = await tx.matchReview.update({
      where: { id: input.reviewId },
      data: {
        status: input.status,
        publishedAt: nextPublishedAt,
      },
      select: {
        id: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorRole: input.actor.role,
        action: input.status === "PUBLISHED" ? "PUBLISH_REVIEW" : "OFFLINE_REVIEW",
        entityType: "MatchReview",
        entityId: input.reviewId,
        beforeJson: toAuditJson(previous),
        afterJson: toAuditJson(review),
      },
    });

    return review;
  });

  return {
    id: updated.id,
    status: updated.status,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function updateAdminUser(userId: string, input: UserWriteInput & { actor: AppUser }) {
  if (userId === input.actor.id && input.status === "DISABLED") {
    throw new Error("SELF_DISABLE_NOT_ALLOWED");
  }

  const previous = await prisma.user.findUnique({
    where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        phone: true,
        nickname: true,
      },
  });

  if (!previous) {
    return null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        phone: input.phone === "" ? null : input.phone,
        nickname: input.nickname,
        role: input.role,
        status: input.status,
      },
      select: {
        id: true,
        phone: true,
        nickname: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    if (input.status === "DISABLED") {
      await tx.session.deleteMany({ where: { userId } });
    }

    await tx.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorRole: input.actor.role,
        action: "UPDATE_USER",
        entityType: "User",
        entityId: userId,
        beforeJson: toAuditJson(previous),
        afterJson: toAuditJson(user),
      },
    });

    return user;
  });

  return {
    id: updated.id,
    phone: updated.phone ? maskPhone(updated.phone) : "-",
    rawPhone: updated.phone ?? "",
    nickname: updated.nickname ?? "-",
    role: updated.role,
    status: updated.status,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function createAdminAccount(input: AdminAccountWriteInput & { actor: AppUser }) {
  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: input.username.toLowerCase(),
        passwordHash: input.password ? hashValue(input.password) : null,
        phone: input.phone === "" ? null : input.phone,
        nickname: input.nickname,
        role: input.role,
        status: input.status,
      },
      select: {
        id: true,
        username: true,
        phone: true,
        nickname: true,
        role: true,
        status: true,
        passwordHash: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorRole: input.actor.role,
        action: "CREATE_ADMIN_ACCOUNT",
        entityType: "User",
        entityId: user.id,
        afterJson: toAuditJson({ ...user, passwordHash: user.passwordHash ? "***" : null }),
      },
    });

    return user;
  });

  return {
    id: created.id,
    username: created.username ?? "",
    phone: created.phone ? maskPhone(created.phone) : "-",
    rawPhone: created.phone ?? "",
    nickname: created.nickname ?? "-",
    role: created.role,
    status: created.status,
    passwordSet: Boolean(created.passwordHash),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateAdminAccount(accountId: string, input: AdminAccountWriteInput & { actor: AppUser }) {
  if (accountId === input.actor.id && input.status === "DISABLED") {
    throw new Error("SELF_DISABLE_NOT_ALLOWED");
  }

  const previous = await prisma.user.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      username: true,
      phone: true,
      nickname: true,
      role: true,
      status: true,
      passwordHash: true,
    },
  });

  if (!previous) {
    return null;
  }

  const nextPasswordHash = input.password ? hashValue(input.password) : previous.passwordHash;

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: accountId },
      data: {
        username: input.username.toLowerCase(),
        passwordHash: nextPasswordHash,
        phone: input.phone === "" ? null : input.phone,
        nickname: input.nickname,
        role: input.role,
        status: input.status,
      },
      select: {
        id: true,
        username: true,
        phone: true,
        nickname: true,
        role: true,
        status: true,
        passwordHash: true,
        updatedAt: true,
      },
    });

    if (input.status === "DISABLED" || input.password) {
      await tx.session.deleteMany({ where: { userId: accountId } });
    }

    await tx.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorRole: input.actor.role,
        action: "UPDATE_ADMIN_ACCOUNT",
        entityType: "User",
        entityId: accountId,
        beforeJson: toAuditJson({ ...previous, passwordHash: previous.passwordHash ? "***" : null }),
        afterJson: toAuditJson({ ...user, passwordHash: user.passwordHash ? "***" : null }),
      },
    });

    return user;
  });

  return {
    id: updated.id,
    username: updated.username ?? "",
    phone: updated.phone ? maskPhone(updated.phone) : "-",
    rawPhone: updated.phone ?? "",
    nickname: updated.nickname ?? "-",
    role: updated.role,
    status: updated.status,
    passwordSet: Boolean(updated.passwordHash),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function createAdminMatch(input: MatchWriteInput & { actor: AppUser }) {
  const created = await prisma.$transaction(async (tx) => {
    const [competition, homeTeam, awayTeam] = await Promise.all([
      findOrCreateCompetition(tx, input.competitionName),
      findOrCreateTeam(tx, input.homeTeamName),
      findOrCreateTeam(tx, input.awayTeamName),
    ]);

    const match = await tx.match.create({
      data: {
        competitionId: competition.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffAt: input.kickoffAt,
        status: input.status,
        venue: input.venue,
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        source: input.source ?? "manual",
      },
      select: {
        id: true,
        status: true,
        kickoffAt: true,
        homeScore: true,
        awayScore: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorRole: input.actor.role,
        action: "CREATE_MATCH",
        entityType: "Match",
        entityId: match.id,
        afterJson: toAuditJson(match),
      },
    });

    return match;
  });

  return {
    id: created.id,
    status: created.status,
    kickoffAt: created.kickoffAt.toISOString(),
  };
}

export async function updateAdminMatch(matchId: string, input: MatchWriteInput & { actor: AppUser }) {
  const previous = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      competitionId: true,
      homeTeamId: true,
      awayTeamId: true,
      kickoffAt: true,
      status: true,
      venue: true,
      homeScore: true,
      awayScore: true,
      source: true,
    },
  });

  if (!previous) {
    return null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const [competition, homeTeam, awayTeam] = await Promise.all([
      findOrCreateCompetition(tx, input.competitionName),
      findOrCreateTeam(tx, input.homeTeamName),
      findOrCreateTeam(tx, input.awayTeamName),
    ]);

    const match = await tx.match.update({
      where: { id: matchId },
      data: {
        competitionId: competition.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffAt: input.kickoffAt,
        status: input.status,
        venue: input.venue,
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        source: input.source ?? "manual",
      },
      select: {
        id: true,
        status: true,
        kickoffAt: true,
        homeScore: true,
        awayScore: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorRole: input.actor.role,
        action: "UPDATE_MATCH",
        entityType: "Match",
        entityId: matchId,
        beforeJson: toAuditJson(previous),
        afterJson: toAuditJson(match),
      },
    });

    return match;
  });

  return {
    id: updated.id,
    status: updated.status,
    kickoffAt: updated.kickoffAt.toISOString(),
  };
}

export async function createAdminPrediction(input: PredictionWriteInput & { actor: AppUser }) {
  const created = await prisma.$transaction(async (tx) => {
    const prediction = await tx.prediction.create({
      data: {
        matchId: input.matchId,
        summary: input.summary,
        winDrawLossPick: input.winDrawLossPick,
        handicapPick: input.handicapPick,
        scorePicks: input.scorePicks,
        totalGoalsPick: input.totalGoalsPick,
        halfFullPick: input.halfFullPick,
        riskLevel: input.riskLevel,
        confidence: input.confidence,
        coldAlertReason: input.coldAlertReason,
        status: input.status,
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        sections: input.sections?.length
          ? {
              create: input.sections.map((section, index) => ({
                sectionKey: section.sectionKey,
                title: section.title,
                content: section.content,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        matchId: true,
        status: true,
        summary: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorRole: input.actor.role,
        action: "CREATE_PREDICTION",
        entityType: "Prediction",
        entityId: prediction.id,
        afterJson: toAuditJson(prediction),
      },
    });

    return prediction;
  });

  return {
    id: created.id,
    matchId: created.matchId,
    status: created.status,
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateAdminPrediction(predictionId: string, input: PredictionWriteInput & { actor: AppUser }) {
  const previous = await prisma.prediction.findUnique({
    where: { id: predictionId },
    select: {
      id: true,
      matchId: true,
      summary: true,
      winDrawLossPick: true,
      handicapPick: true,
      scorePicks: true,
      totalGoalsPick: true,
      halfFullPick: true,
      riskLevel: true,
      confidence: true,
      coldAlertReason: true,
      status: true,
      publishedAt: true,
    },
  });

  if (!previous) {
    return null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const prediction = await tx.prediction.update({
      where: { id: predictionId },
      data: {
        matchId: input.matchId,
        summary: input.summary,
        winDrawLossPick: input.winDrawLossPick,
        handicapPick: input.handicapPick,
        scorePicks: input.scorePicks,
        totalGoalsPick: input.totalGoalsPick,
        halfFullPick: input.halfFullPick,
        riskLevel: input.riskLevel,
        confidence: input.confidence,
        coldAlertReason: input.coldAlertReason,
        status: input.status,
        publishedAt: input.status === "PUBLISHED" ? (previous.publishedAt ?? new Date()) : previous.publishedAt,
      },
      select: {
        id: true,
        matchId: true,
        status: true,
        summary: true,
        updatedAt: true,
      },
    });

    if (input.sections?.length) {
      await tx.predictionSection.deleteMany({ where: { predictionId } });
      await tx.predictionSection.createMany({
        data: input.sections.map((section, index) => ({
          predictionId,
          sectionKey: section.sectionKey,
          title: section.title,
          content: section.content,
          sortOrder: index,
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorRole: input.actor.role,
        action: "UPDATE_PREDICTION",
        entityType: "Prediction",
        entityId: predictionId,
        beforeJson: toAuditJson(previous),
        afterJson: toAuditJson(prediction),
      },
    });

    return prediction;
  });

  return {
    id: updated.id,
    matchId: updated.matchId,
    status: updated.status,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function createAdminReview(input: ReviewWriteInput & { actor: AppUser }) {
  const created = await prisma.$transaction(async (tx) => {
    const review = await tx.matchReview.create({
      data: {
        matchId: input.matchId,
        predictionId: input.predictionId,
        actualResult: input.actualResult,
        resultType: input.resultType,
        hitSummary: input.hitSummary,
        missReason: input.missReason,
        correctionNote: input.correctionNote,
        status: input.status,
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      },
      select: {
        id: true,
        matchId: true,
        predictionId: true,
        status: true,
        actualResult: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorRole: input.actor.role,
        action: "CREATE_REVIEW",
        entityType: "MatchReview",
        entityId: review.id,
        afterJson: toAuditJson(review),
      },
    });

    return review;
  });

  return {
    id: created.id,
    matchId: created.matchId,
    predictionId: created.predictionId,
    status: created.status,
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateAdminReview(reviewId: string, input: ReviewWriteInput & { actor: AppUser }) {
  const previous = await prisma.matchReview.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      matchId: true,
      predictionId: true,
      actualResult: true,
      resultType: true,
      hitSummary: true,
      missReason: true,
      correctionNote: true,
      status: true,
      publishedAt: true,
    },
  });

  if (!previous) {
    return null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const review = await tx.matchReview.update({
      where: { id: reviewId },
      data: {
        matchId: input.matchId,
        predictionId: input.predictionId,
        actualResult: input.actualResult,
        resultType: input.resultType,
        hitSummary: input.hitSummary,
        missReason: input.missReason,
        correctionNote: input.correctionNote,
        status: input.status,
        publishedAt: input.status === "PUBLISHED" ? (previous.publishedAt ?? new Date()) : previous.publishedAt,
      },
      select: {
        id: true,
        matchId: true,
        predictionId: true,
        status: true,
        actualResult: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorRole: input.actor.role,
        action: "UPDATE_REVIEW",
        entityType: "MatchReview",
        entityId: reviewId,
        beforeJson: toAuditJson(previous),
        afterJson: toAuditJson(review),
      },
    });

    return review;
  });

  return {
    id: updated.id,
    matchId: updated.matchId,
    predictionId: updated.predictionId,
    status: updated.status,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function createAdminAdCampaign(input: AdCampaignWriteInput & { actor: AppUser }) {
  assertNoSensitiveWords([input.title, input.description, input.creativeTitle, input.creativeBody]);
  const slot = await prisma.adSlot.findUnique({
    where: { id: input.slotId },
    select: { code: true },
  });

  if (slot?.code === "HOME_TOP" && !input.imageUrl) {
    throw new Error("HOME_BANNER_IMAGE_REQUIRED");
  }

  const created = await prisma.$transaction(async (tx) => {
    const campaign = await tx.adCampaign.create({
      data: {
        accountId: input.accountId,
        slotId: input.slotId,
        title: input.title,
        description: input.description,
        targetUrl: input.targetUrl,
        priority: input.priority,
        status: input.status,
        startAt: input.startAt,
        endAt: input.endAt,
        creatives: {
          create: {
            title: input.creativeTitle,
            body: input.creativeBody,
            imageUrl: input.imageUrl,
            status: input.status === "APPROVED" ? "APPROVED" : "PENDING_REVIEW",
          },
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorRole: input.actor.role,
        action: "CREATE_AD_CAMPAIGN",
        entityType: "AdCampaign",
        entityId: campaign.id,
        afterJson: toAuditJson(campaign),
      },
    });

    return campaign;
  });

  return {
    id: created.id,
    title: created.title,
    status: created.status,
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateAdminAdCampaign(campaignId: string, input: AdCampaignWriteInput & { actor: AppUser }) {
  assertNoSensitiveWords([input.title, input.description, input.creativeTitle, input.creativeBody]);
  const slot = await prisma.adSlot.findUnique({
    where: { id: input.slotId },
    select: { code: true },
  });

  if (slot?.code === "HOME_TOP" && !input.imageUrl) {
    throw new Error("HOME_BANNER_IMAGE_REQUIRED");
  }

  const previous = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      accountId: true,
      slotId: true,
      title: true,
      description: true,
      targetUrl: true,
      priority: true,
      status: true,
      startAt: true,
      endAt: true,
      creatives: {
        select: {
          id: true,
          title: true,
          body: true,
          imageUrl: true,
          status: true,
        },
      },
    },
  });

  if (!previous) {
    return null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const campaign = await tx.adCampaign.update({
      where: { id: campaignId },
      data: {
        accountId: input.accountId,
        slotId: input.slotId,
        title: input.title,
        description: input.description,
        targetUrl: input.targetUrl,
        priority: input.priority,
        status: input.status,
        startAt: input.startAt,
        endAt: input.endAt,
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    });

    const creativeId = previous.creatives[0]?.id;
    if (creativeId) {
      await tx.adCreative.update({
        where: { id: creativeId },
        data: {
          title: input.creativeTitle,
          body: input.creativeBody,
          imageUrl: input.imageUrl,
          status: input.status === "APPROVED" ? "APPROVED" : "PENDING_REVIEW",
          rejectReason: null,
        },
      });
    } else {
      await tx.adCreative.create({
        data: {
          campaignId,
          title: input.creativeTitle,
          body: input.creativeBody,
          imageUrl: input.imageUrl,
          status: input.status === "APPROVED" ? "APPROVED" : "PENDING_REVIEW",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorRole: input.actor.role,
        action: "UPDATE_AD_CAMPAIGN",
        entityType: "AdCampaign",
        entityId: campaignId,
        beforeJson: toAuditJson(previous),
        afterJson: toAuditJson(campaign),
      },
    });

    return campaign;
  });

  return {
    id: updated.id,
    title: updated.title,
    status: updated.status,
    updatedAt: updated.updatedAt.toISOString(),
  };
}
