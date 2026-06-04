import { prisma } from "@/lib/db";
import type { AppUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { getAutomationSettings } from "@/services/admin-settings";
import { runAutoPredictions, runAutoReviews, runPrematchReanalysis } from "@/services/auto-ai-jobs";
import { runMatchSourceSync } from "@/services/match-source-sync";

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;
const SCHEDULER_INTERVAL_MS = 60 * 1000;

const globalForScheduler = globalThis as unknown as {
  footballAiSchedulerStarted?: boolean;
};

function getBeijingNow(date = new Date()) {
  return new Date(date.getTime() + BEIJING_OFFSET_MS);
}

function getBeijingDateLabel(date = new Date()) {
  const beijing = getBeijingNow(date);
  return `${beijing.getUTCFullYear()}-${String(beijing.getUTCMonth() + 1).padStart(2, "0")}-${String(
    beijing.getUTCDate(),
  ).padStart(2, "0")}`;
}

function getBeijingTimeLabel(date = new Date()) {
  const beijing = getBeijingNow(date);
  return `${String(beijing.getUTCHours()).padStart(2, "0")}:${String(beijing.getUTCMinutes()).padStart(2, "0")}`;
}

async function getSchedulerActor(): Promise<AppUser | null> {
  const user = await prisma.user.findFirst({
    where: {
      status: "ACTIVE",
      role: { in: ["SUPER_ADMIN", "ADMIN", "ANALYST"] },
    },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      phone: true,
      nickname: true,
      role: true,
    },
  });

  if (!user || !hasRole(user.role, "ANALYST")) {
    return null;
  }

  return {
    id: user.id,
    phone: user.phone ?? "",
    nickname: user.nickname ?? "系统任务",
    role: user.role,
  };
}

async function wasRunToday(eventName: string, dateLabel: string) {
  const existing = await prisma.systemEvent.findFirst({
    where: {
      eventName,
      path: `/scheduler/${dateLabel}`,
    },
    select: { id: true },
  });

  return Boolean(existing);
}

async function recordRun(eventName: string, actor: AppUser, dateLabel: string, payload: unknown) {
  await prisma.systemEvent.create({
    data: {
      eventName,
      userId: actor.id,
      path: `/scheduler/${dateLabel}`,
      payload: payload as object,
    },
  });
}

async function runDailyPredictionPipeline(actor: AppUser, dateLabel: string) {
  if (await wasRunToday("SCHEDULER_DAILY_PREDICTION_PIPELINE", dateLabel)) {
    return;
  }

  const syncResult = await runMatchSourceSync(actor);
  const predictionResult = await runAutoPredictions(actor);

  await recordRun("SCHEDULER_DAILY_PREDICTION_PIPELINE", actor, dateLabel, {
    syncResult,
    predictionResult,
  });
}

async function runDailyReviewPipeline(actor: AppUser, dateLabel: string) {
  if (await wasRunToday("SCHEDULER_DAILY_REVIEW_PIPELINE", dateLabel)) {
    return;
  }

  const reviewResult = await runAutoReviews(actor);
  await recordRun("SCHEDULER_DAILY_REVIEW_PIPELINE", actor, dateLabel, { reviewResult });
}

async function runSchedulerTick() {
  const settings = await getAutomationSettings();
  const actor = await getSchedulerActor();

  if (!actor) {
    console.error("Football AI scheduler skipped: no active analyst/admin actor.");
    return;
  }

  const now = new Date();
  const dateLabel = getBeijingDateLabel(now);
  const timeLabel = getBeijingTimeLabel(now);

  if (settings.reviewEnabled && timeLabel === settings.reviewRunAt) {
    await runDailyReviewPipeline(actor, dateLabel);
  }

  if (settings.predictionEnabled && timeLabel === settings.predictionRunAt) {
    await runDailyPredictionPipeline(actor, dateLabel);
  }

  if (settings.prematchReanalysisEnabled && now.getUTCMinutes() % 5 === 0) {
    await runPrematchReanalysis(actor);
  }
}

export function startAppScheduler() {
  if (process.env.NODE_ENV !== "production" || process.env.APP_SCHEDULER_DISABLED === "true") {
    return;
  }

  if (globalForScheduler.footballAiSchedulerStarted) {
    return;
  }

  globalForScheduler.footballAiSchedulerStarted = true;
  console.log("Football AI app scheduler started.");

  setInterval(() => {
    void runSchedulerTick().catch((error) => {
      console.error("Football AI scheduler tick failed", error);
    });
  }, SCHEDULER_INTERVAL_MS);
}
