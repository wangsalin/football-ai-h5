import { prisma } from "@/lib/db";

export async function getUserProfileData(userId: string) {
  const [favorites, reminders, followedTeams, favoriteCount, reminderCount, followedTeamCount] = await Promise.all([
    prisma.favoriteMatch.findMany({
      where: { userId },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
      take: 3,
    }),
    prisma.reminder.findMany({
      where: { userId },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
      take: 3,
    }),
    prisma.followedTeam.findMany({
      where: { userId },
      include: { team: true },
      take: 3,
    }),
    prisma.favoriteMatch.count({ where: { userId } }),
    prisma.reminder.count({ where: { userId } }),
    prisma.followedTeam.count({ where: { userId } }),
  ]);

  return {
    favoriteCount,
    reminderCount,
    followedTeamCount,
    favoriteHint: favorites[0]
      ? `${favorites[0].match.homeTeam.name} vs ${favorites[0].match.awayTeam.name}`
      : "暂无收藏",
    reminderHint: reminders[0]
      ? `${reminders[0].match.homeTeam.name} vs ${reminders[0].match.awayTeam.name}`
      : "暂无提醒",
    followedTeamHint: followedTeams[0]?.team.name ?? "暂无关注",
    historyCount: 3,
    historyHint: "最近查看的分析",
  };
}
