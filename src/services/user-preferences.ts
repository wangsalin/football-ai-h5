import { prisma } from "@/lib/db";

export async function getUserMatchPreferences(userId: string | undefined, matchId: string) {
  if (!userId) {
    return {
      isFavorite: false,
      hasReminder: false,
    };
  }

  const [favorite, reminder] = await Promise.all([
    prisma.favoriteMatch.findUnique({
      where: {
        userId_matchId: {
          userId,
          matchId,
        },
      },
      select: { id: true },
    }),
    prisma.reminder.findUnique({
      where: {
        userId_matchId: {
          userId,
          matchId,
        },
      },
      select: { id: true },
    }),
  ]);

  return {
    isFavorite: Boolean(favorite),
    hasReminder: Boolean(reminder),
  };
}

export async function setFavoriteMatch(input: { userId: string; matchId: string; enabled: boolean }) {
  if (input.enabled) {
    const favorite = await prisma.favoriteMatch.upsert({
      where: {
        userId_matchId: {
          userId: input.userId,
          matchId: input.matchId,
        },
      },
      update: {},
      create: {
        userId: input.userId,
        matchId: input.matchId,
      },
      select: { id: true, matchId: true, createdAt: true },
    });

    await prisma.systemEvent.create({
      data: {
        eventName: "FAVORITE_MATCH",
        userId: input.userId,
        path: `/matches/${input.matchId}`,
        payload: { matchId: input.matchId },
      },
    });

    return favorite;
  }

  await prisma.favoriteMatch.deleteMany({
    where: {
      userId: input.userId,
      matchId: input.matchId,
    },
  });

  await prisma.systemEvent.create({
    data: {
      eventName: "UNFAVORITE_MATCH",
      userId: input.userId,
      path: `/matches/${input.matchId}`,
      payload: { matchId: input.matchId },
    },
  });

  return null;
}

export async function setMatchReminder(input: { userId: string; matchId: string; enabled: boolean }) {
  if (input.enabled) {
    const match = await prisma.match.findUnique({
      where: { id: input.matchId },
      select: { kickoffAt: true },
    });

    if (!match) {
      return undefined;
    }

    const remindAt = new Date(match.kickoffAt.getTime() - 30 * 60 * 1000);
    const reminder = await prisma.reminder.upsert({
      where: {
        userId_matchId: {
          userId: input.userId,
          matchId: input.matchId,
        },
      },
      update: { remindAt, sentAt: null },
      create: {
        userId: input.userId,
        matchId: input.matchId,
        remindAt,
      },
      select: { id: true, matchId: true, remindAt: true },
    });

    await prisma.systemEvent.create({
      data: {
        eventName: "SET_MATCH_REMINDER",
        userId: input.userId,
        path: `/matches/${input.matchId}`,
        payload: { matchId: input.matchId, remindAt: remindAt.toISOString() },
      },
    });

    return reminder;
  }

  await prisma.reminder.deleteMany({
    where: {
      userId: input.userId,
      matchId: input.matchId,
    },
  });

  await prisma.systemEvent.create({
    data: {
      eventName: "CANCEL_MATCH_REMINDER",
      userId: input.userId,
      path: `/matches/${input.matchId}`,
      payload: { matchId: input.matchId },
    },
  });

  return null;
}
