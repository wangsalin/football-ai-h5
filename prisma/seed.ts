import { createHash } from "node:crypto";
import { AdSlotCode, PublishStatus, RiskLevel, UserRole } from "@prisma/client";
import { createPrismaClient } from "../src/lib/prisma-client";

const prisma = createPrismaClient();

const dayMs = 24 * 60 * 60 * 1000;
const now = new Date();

function atDayOffset(dayOffset: number, hour: number, minute = 0) {
  const date = new Date(now.getTime() + dayOffset * dayMs);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function hashSeedValue(value: string) {
  return createHash("sha256").update(`${process.env.JWT_SECRET ?? ""}:${value}`).digest("hex");
}

async function main() {
  await prisma.systemConfig.deleteMany();
  await prisma.systemEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.leadForm.deleteMany();
  await prisma.adEvent.deleteMany();
  await prisma.adCreative.deleteMany();
  await prisma.adCampaign.deleteMany();
  await prisma.adSlot.deleteMany();
  await prisma.adAccount.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.followedTeam.deleteMany();
  await prisma.favoriteMatch.deleteMany();
  await prisma.matchReview.deleteMany();
  await prisma.predictionSection.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.injuryReport.deleteMany();
  await prisma.oddsSnapshot.deleteMany();
  await prisma.matchStats.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all([
    prisma.user.create({
      data: { phone: "13800000001", nickname: "普通用户", role: UserRole.USER },
    }),
    prisma.user.create({
      data: { phone: "13800000002", nickname: "广告主", role: UserRole.ADVERTISER },
    }),
    prisma.user.create({
      data: {
        phone: "13800000003",
        username: "analyst",
        passwordHash: hashSeedValue("analyst123456"),
        nickname: "分析师",
        role: UserRole.ANALYST,
      },
    }),
    prisma.user.create({
      data: {
        phone: "13800000004",
        username: "admin",
        passwordHash: hashSeedValue("admin123456"),
        nickname: "管理员",
        role: UserRole.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        phone: "13800000005",
        username: "superadmin",
        passwordHash: hashSeedValue("superadmin123456"),
        nickname: "超级管理员",
        role: UserRole.SUPER_ADMIN,
      },
    }),
  ]);

  const competitions = await Promise.all(
    [
      ["德甲", "德国"],
      ["英超", "英格兰"],
      ["西甲", "西班牙"],
    ].map(([name, country]) => prisma.competition.create({ data: { name, country } })),
  );

  const teams = await Promise.all(
    ["帕德博恩", "沃尔夫斯堡", "阿森纳", "埃弗顿", "皇家社会", "瓦伦西亚", "拉齐奥", "都灵"].map(
      (name) => prisma.team.create({ data: { name, shortName: name.slice(0, 3) } }),
    ),
  );

  const [bundesliga, premierLeague, laLiga] = competitions;
  const [paderborn, wolfsburg, arsenal, everton, sociedad, valencia, lazio, torino] = teams;

  const matches = await Promise.all([
    prisma.match.create({
      data: {
        competitionId: bundesliga.id,
        homeTeamId: paderborn.id,
        awayTeamId: wolfsburg.id,
        kickoffAt: atDayOffset(0, 19, 30),
        venue: "主队主场",
      },
    }),
    prisma.match.create({
      data: {
        competitionId: premierLeague.id,
        homeTeamId: arsenal.id,
        awayTeamId: everton.id,
        kickoffAt: atDayOffset(0, 22, 0),
      },
    }),
    prisma.match.create({
      data: {
        competitionId: laLiga.id,
        homeTeamId: sociedad.id,
        awayTeamId: valencia.id,
        kickoffAt: atDayOffset(1, 2, 45),
      },
    }),
    prisma.match.create({
      data: {
        competitionId: bundesliga.id,
        homeTeamId: wolfsburg.id,
        awayTeamId: arsenal.id,
        kickoffAt: atDayOffset(1, 20, 0),
      },
    }),
    prisma.match.create({
      data: {
        competitionId: premierLeague.id,
        homeTeamId: everton.id,
        awayTeamId: sociedad.id,
        kickoffAt: atDayOffset(1, 23, 0),
      },
    }),
    prisma.match.create({
      data: {
        competitionId: laLiga.id,
        homeTeamId: valencia.id,
        awayTeamId: lazio.id,
        kickoffAt: atDayOffset(-1, 3, 0),
        status: "FINISHED",
        homeScore: 1,
        awayScore: 1,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: premierLeague.id,
        homeTeamId: arsenal.id,
        awayTeamId: torino.id,
        kickoffAt: atDayOffset(-1, 21, 30),
        status: "FINISHED",
        homeScore: 2,
        awayScore: 0,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: bundesliga.id,
        homeTeamId: lazio.id,
        awayTeamId: torino.id,
        kickoffAt: atDayOffset(-2, 20, 45),
        status: "FINISHED",
        homeScore: 0,
        awayScore: 1,
      },
    }),
  ]);

  await Promise.all(
    matches.map((match, index) =>
      prisma.matchStats.create({
        data: {
          matchId: match.id,
          homeRank: 4 + index,
          awayRank: 8 + index,
          homeRecentForm: "胜平负胜平",
          awayRecentForm: "负平胜负平",
          summary: "双方状态接近，主队主场稳定性略好。",
        },
      }),
    ),
  );

  const predictionSeeds = [
    [matches[0], "主队不败优先，但需要防平。", RiskLevel.MEDIUM, PublishStatus.PUBLISHED],
    [matches[1], "主队基本面更完整，进攻端优势明显。", RiskLevel.LOW, PublishStatus.PUBLISHED],
    [matches[2], "客队反击效率不低，主队方向不宜过热。", RiskLevel.HIGH, PublishStatus.PUBLISHED],
    [matches[3], "两队轮换因素较多，先保留草稿。", RiskLevel.MEDIUM, PublishStatus.DRAFT],
    [matches[4], "盘口信息不足，不能作为强结论。", RiskLevel.HIGH, PublishStatus.DRAFT],
  ] as const;

  for (const [match, summary, riskLevel, status] of predictionSeeds) {
    const prediction = await prisma.prediction.create({
      data: {
        matchId: match.id,
        summary,
        winDrawLossPick: "胜/平",
        handicapPick: "让平/让负",
        scorePicks: ["1-0", "1-1", "2-1"],
        totalGoalsPick: "2/3球",
        halfFullPick: "平胜/平平",
        riskLevel,
        confidence: riskLevel === RiskLevel.LOW ? 7.2 : riskLevel === RiskLevel.MEDIUM ? 6.5 : 5.8,
        coldAlertReason: "市场热度变化较快，需要关注临场阵容和盘口方向。",
        status,
        publishedAt: status === PublishStatus.PUBLISHED ? now : null,
      },
    });

    await prisma.predictionSection.createMany({
      data: [
        { predictionId: prediction.id, sectionKey: "basic", title: "基本面", content: "主队排名和稳定性略占优势。", sortOrder: 1 },
        { predictionId: prediction.id, sectionKey: "lineup", title: "阵容面", content: "双方均有个别伤停，暂未改变整体判断。", sortOrder: 2 },
        { predictionId: prediction.id, sectionKey: "odds", title: "数据面", content: "初始数据支持主队方向，但热度上升后需要防平。", sortOrder: 3 },
        { predictionId: prediction.id, sectionKey: "tempo", title: "比赛节奏", content: "预计前段谨慎，中后段空间增加。", sortOrder: 4 },
        { predictionId: prediction.id, sectionKey: "risk", title: "风险提示", content: "仅供数据分析参考，不构成投注建议。", sortOrder: 5 },
      ],
    });
  }

  const finishedMatches = matches.slice(5, 8);
  for (const [index, match] of finishedMatches.entries()) {
    await prisma.matchReview.create({
      data: {
        matchId: match.id,
        actualResult: `${match.homeScore}-${match.awayScore}`,
        resultType: index === 2 ? "MISS" : "HIT",
        hitSummary: index === 2 ? "方向判断偏差，客队反击质量超出预期。" : "主线判断符合赛前分析。",
        missReason: index === 2 ? "战意和转换效率评估不足。" : null,
        correctionNote: "后续提高对临场阵容和热门方向的权重。",
        status: PublishStatus.PUBLISHED,
        publishedAt: now,
      },
    });
  }

  const adSlotSeeds: Array<[AdSlotCode, string]> = [
      [AdSlotCode.HOME_TOP, "首页轮播 Banner"],
      [AdSlotCode.HOME_CARD, "首页比赛卡中插"],
      [AdSlotCode.MATCH_DETAIL_STICKY, "详情页悬浮贴片"],
      [AdSlotCode.REVIEW_TOP, "复盘页顶部"],
  ];

  const adSlots = await Promise.all(
    adSlotSeeds.map(([code, name]) => prisma.adSlot.create({ data: { code, name } })),
  );

  const adAccounts = await Promise.all(
    ["城南精酿", "夜猫烧烤", "绿茵球馆"].map((companyName, index) =>
      prisma.adAccount.create({
        data: {
          userId: [users[1].id, users[2].id, users[3].id][index],
          companyName,
          contactName: `联系人${index + 1}`,
          phone: `1390000000${index + 1}`,
          city: "上海",
        },
      }),
    ),
  );

  const campaigns = [];
  for (const [index, slot] of adSlots.entries()) {
    const campaign = await prisma.adCampaign.create({
      data: {
        accountId: adAccounts[index % adAccounts.length].id,
        slotId: slot.id,
        title: `${slot.name}观赛套餐`,
        description: "本地看球消费广告，已标记广告。",
        targetUrl: "https://example.com",
        priority: 10 - index,
        status: "APPROVED",
        startAt: atDayOffset(-3, 0),
        endAt: atDayOffset(14, 23, 59),
      },
    });
    campaigns.push(campaign);
    await prisma.adCreative.create({
      data: {
        campaignId: campaign.id,
        title: `${slot.name}广告`,
        body: "看球小聚，理性观赛。",
        imageUrl: "/uploads/mock-ad.svg",
        status: "APPROVED",
      },
    });
  }

  for (let i = 0; i < 20; i += 1) {
    await prisma.adEvent.create({
      data: {
        campaignId: campaigns[i % campaigns.length].id,
        eventType: i % 4 === 0 ? "CLICK" : "IMPRESSION",
        pagePath: i % 2 === 0 ? "/" : "/matches",
        ipHash: `seed-ip-${i % 5}`,
        userAgent: "seed",
      },
    });
  }

  await prisma.favoriteMatch.create({ data: { userId: users[0].id, matchId: matches[0].id } });
  await prisma.followedTeam.create({ data: { userId: users[0].id, teamId: arsenal.id } });
  await prisma.reminder.create({ data: { userId: users[0].id, matchId: matches[1].id, remindAt: atDayOffset(0, 21, 30) } });

  await prisma.leadForm.create({
    data: {
      companyName: "新天地酒吧",
      contactName: "王先生",
      phone: "13600000000",
      city: "上海",
      budget: "5000-10000",
      message: "希望投放焦点赛事广告。",
    },
  });

  for (let i = 0; i < 10; i += 1) {
    await prisma.auditLog.create({
      data: {
        actorId: users[3].id,
        actorRole: "ADMIN",
        action: "SEED_ACTION",
        entityType: "Seed",
        entityId: `${i}`,
        afterJson: { index: i },
      },
    });
  }

  await prisma.systemConfig.create({
    data: {
      key: "disclaimer",
      value: "本平台仅提供足球赛事情报、数据分析和观点参考，不销售彩票，不提供代购或跟单服务，不构成投注建议，不承诺任何收益。",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
