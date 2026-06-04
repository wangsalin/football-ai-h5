import { expect, test } from "@playwright/test";

async function loginAdmin(page: import("@playwright/test").Page, redirect = "/admin") {
  await page.request.post("/api/auth/password-login", { data: { username: "admin", password: "admin123456" } });
  await page.goto(redirect);
}

async function loginByPhone(page: import("@playwright/test").Page, phone: string, redirect = "/admin") {
  await page.request.post("/api/auth/send-code", { data: { phone } });
  await page.request.post("/api/auth/login", { data: { phone, code: "123456" } });
  await page.goto(redirect);
}

test("admin can login with username and password", async ({ page }) => {
  await page.goto("/login?redirect=/admin");
  await page.getByLabel("管理账号").fill("admin");
  await page.getByLabel("密码").fill("admin123456");
  await page.getByRole("button", { name: "登录管理端" }).click();

  await expect(page).toHaveURL("http://127.0.0.1:3000/admin");
  await expect(page.getByRole("heading", { name: "运营概览" })).toBeVisible();
});

test("admin can browse admin dashboard and management pages", async ({ page }) => {
  await loginAdmin(page);

  await expect(page.getByRole("heading", { name: "运营概览" })).toBeVisible();
  await expect(page.getByText("待处理预测")).toBeVisible();

  await page.getByRole("link", { name: "用户" }).click();
  await expect(page.getByRole("heading", { name: "用户管理" })).toBeVisible();
  await expect(page.getByText("138****0001")).toBeVisible();

  const userStatusSelect = page.locator('[data-testid^="user-status-"]').first();
  const userId = (await userStatusSelect.getAttribute("data-testid"))?.replace("user-status-", "");
  expect(userId).toBeTruthy();
  const updateProfileResponse = await page.request.patch(`/api/admin/users/${userId}`, {
    data: { phone: "13800000001", nickname: "普通用户编辑", role: "USER", status: "ACTIVE" },
  });
  await expect(updateProfileResponse).toBeOK();
  const disableUserResponse = await page.request.patch(`/api/admin/users/${userId}`, {
    data: { phone: "13800000001", nickname: "普通用户编辑", role: "USER", status: "DISABLED" },
  });
  await expect(disableUserResponse).toBeOK();
  const enableUserResponse = await page.request.patch(`/api/admin/users/${userId}`, {
    data: { phone: "13800000001", nickname: "普通用户", role: "USER", status: "ACTIVE" },
  });
  await expect(enableUserResponse).toBeOK();
  const registrationSettingsResponse = await page.request.post("/api/admin/settings/registration", {
    data: { enabled: true, defaultRole: "USER", disabledMessage: "当前暂未开放新用户注册，请联系管理员。" },
  });
  await expect(registrationSettingsResponse).toBeOK();

  await page.goto("/admin/matches");
  await expect(page.getByRole("heading", { name: "赛事管理" })).toBeVisible();
  const importMatchesResponse = await page.request.post("/api/admin/matches/import", {
    data: {
      matches: [
        {
          competitionName: "测试导入杯",
          homeTeamName: "导入主队",
          awayTeamName: "导入客队",
          kickoffAt: "2026-06-02T12:00:00.000Z",
          status: "SCHEDULED",
          venue: "导入球场",
          homeScore: null,
          awayScore: null,
        },
      ],
    },
  });
  await expect(importMatchesResponse).toBeOK();
  const matchPayload = {
    competitionName: "测试杯",
    homeTeamName: "测试主队",
    awayTeamName: "测试客队",
    kickoffAt: "2026-06-01T12:00:00.000Z",
    status: "SCHEDULED",
    venue: "测试球场",
    homeScore: null,
    awayScore: null,
  };
  const createMatchResponse = await page.request.post("/api/admin/matches", { data: matchPayload });
  await expect(createMatchResponse).toBeOK();
  const createdMatch = await createMatchResponse.json();
  const matchId = createdMatch.data.match.id;
  const updateMatchResponse = await page.request.patch(`/api/admin/matches/${matchId}`, {
    data: {
      ...matchPayload,
      homeTeamName: "测试主队编辑",
      status: "LIVE",
    },
  });
  await expect(updateMatchResponse).toBeOK();
  await page.goto("/admin/matches");
  await expect(page.getByText("测试主队编辑 vs 测试客队").first()).toBeVisible();

  const draftMatchResponse = await page.request.post("/api/admin/matches", {
    data: {
      ...matchPayload,
      homeTeamName: "AIè‰ç¨¿ä¸»é˜Ÿ",
      awayTeamName: "AIè‰ç¨¿å®¢é˜Ÿ",
    },
  });
  await expect(draftMatchResponse).toBeOK();
  const draftMatch = await draftMatchResponse.json();
  const draftMatchId = draftMatch.data.match.id;

  const predictionPayload = {
    matchId,
    summary: "测试预测摘要，主队状态更完整。",
    winDrawLossPick: "胜/平",
    handicapPick: "让平",
    scorePicks: ["1-0", "1-1", "2-1"],
    totalGoalsPick: "2/3球",
    halfFullPick: "平胜",
    riskLevel: "MEDIUM",
    confidence: 6.2,
    coldAlertReason: "测试冷门提醒",
    status: "DRAFT",
  };
  const sensitivePredictionResponse = await page.request.post("/api/admin/predictions", {
    data: {
      ...predictionPayload,
      summary: "本场保证命中。",
    },
  });
  expect(sensitivePredictionResponse.status()).toBe(422);
  const createPredictionResponse = await page.request.post("/api/admin/predictions", { data: predictionPayload });
  await expect(createPredictionResponse).toBeOK();
  const createdPrediction = await createPredictionResponse.json();
  const createdPredictionId = createdPrediction.data.prediction.id;
  const updatePredictionResponse = await page.request.patch(`/api/admin/predictions/${createdPredictionId}`, {
    data: {
      ...predictionPayload,
      summary: "测试预测摘要已编辑，主队状态更完整。",
      confidence: 6.8,
    },
  });
  await expect(updatePredictionResponse).toBeOK();

  const reviewPayload = {
    matchId,
    predictionId: createdPredictionId,
    actualResult: "2-1",
    resultType: "HIT",
    hitSummary: "æµ‹è¯•å¤ç›˜æ‘˜è¦ï¼Œä¸»é˜ŸèŠ‚å¥å’Œé¢„åˆ¤ä¸€è‡´ã€‚",
    missReason: "",
    correctionNote: "æµ‹è¯•ä¿®æ­£è¯´æ˜Ž",
    status: "DRAFT",
  };
  const sensitiveReviewResponse = await page.request.post("/api/admin/reviews", {
    data: {
      ...reviewPayload,
      hitSummary: "复盘不能写包红承诺。",
    },
  });
  expect(sensitiveReviewResponse.status()).toBe(422);
  const createReviewResponse = await page.request.post("/api/admin/reviews", { data: reviewPayload });
  await expect(createReviewResponse).toBeOK();
  const createdReview = await createReviewResponse.json();
  const createdReviewId = createdReview.data.review.id;
  const updateReviewResponse = await page.request.patch(`/api/admin/reviews/${createdReviewId}`, {
    data: {
      ...reviewPayload,
      actualResult: "2-2",
      resultType: "PARTIAL",
      hitSummary: "æµ‹è¯•å¤ç›˜æ‘˜è¦å·²ç¼–è¾‘ï¼Œå…³é”®èµ°åŠ¿éƒ¨åˆ†å‘½ä¸­ã€‚",
      missReason: "ä¸‹åŠåœºèŠ‚å¥åå·®",
    },
  });
  await expect(updateReviewResponse).toBeOK();

  await page.getByRole("link", { name: "预测" }).click();
  await expect(page.getByRole("heading", { name: "预测管理" })).toBeVisible();
  await expect(page.getByText("测试预测摘要已编辑").first()).toBeVisible();
  await expect(page.getByText("预测状态流")).toBeVisible();
  const predictionStatusButton = page.getByTestId(/^prediction-status-/).first();
  const predictionId = (await predictionStatusButton.getAttribute("data-testid"))?.replace("prediction-status-", "");
  expect(predictionId).toBeTruthy();
  const predictionStatusResponse = await page.request.post(`/api/admin/predictions/${predictionId}/status`, {
    data: { status: "PUBLISHED" },
  });
  await expect(predictionStatusResponse).toBeOK();
  await page.getByTestId("draft-match-select").selectOption(draftMatchId);
  await page.getByRole("button", { name: "AI 生成草稿" }).click();
  await expect(page.getByText("已生成草稿")).toBeVisible();

  await page.getByTestId("draft-save-submit").click();
  await expect(page.getByText("AI 草稿已保存为预测草稿")).toBeVisible();

  await page.goto("/admin/reviews");
  await expect(page.getByRole("heading", { name: "复盘管理" })).toBeVisible();
  await expect(page.getByText("æµ‹è¯•å¤ç›˜æ‘˜è¦å·²ç¼–è¾‘").first()).toBeVisible();
  const reviewStatusResponse = await page.request.post(`/api/admin/reviews/${createdReviewId}/status`, {
    data: { status: "PUBLISHED" },
  });
  await expect(reviewStatusResponse).toBeOK();

  await page.getByRole("link", { name: "广告" }).click();
  await expect(page.getByRole("heading", { name: "广告管理" })).toBeVisible();
  await expect(page.getByText("审核底线")).toBeVisible();
  const adAccountId = await page.locator("select").nth(0).inputValue();
  const adSlotId = await page.locator("select").nth(1).inputValue();
  const adPayload = {
    accountId: adAccountId,
    slotId: adSlotId,
    title: "测试广告计划",
    description: "测试广告描述",
    targetUrl: "https://example.com",
    priority: 9,
    status: "PENDING_REVIEW",
    startAt: "2026-06-01T00:00:00.000Z",
    endAt: "2026-06-10T00:00:00.000Z",
    creativeTitle: "测试广告素材",
    creativeBody: "测试广告文案",
    imageUrl: "/uploads/mock-ad.svg",
  };
  const createAdResponse = await page.request.post("/api/admin/ads", { data: adPayload });
  await expect(createAdResponse).toBeOK();
  const createdAd = await createAdResponse.json();
  const createdAdId = createdAd.data.campaign.id;
  const updateAdResponse = await page.request.patch(`/api/admin/ads/${createdAdId}`, {
    data: { ...adPayload, title: "测试广告计划已编辑", priority: 10 },
  });
  await expect(updateAdResponse).toBeOK();
  const adStatusResponse = page.waitForResponse(
    (response) => response.url().includes("/api/admin/ads/") && response.url().includes("/status"),
  );
  await page.getByTestId(/^ad-approve-/).first().click();
  expect((await adStatusResponse).ok()).toBe(true);

  await page.goto("/admin/settings");
  await expect(page.getByRole("heading", { name: "系统设置" })).toBeVisible();
  const aiSettingsResponse = await page.request.post("/api/admin/settings/ai", {
    data: {
      provider: "mock",
      apiBaseUrl: "https://api.openai.com/v1",
      apiKey: "",
      apiKeySet: false,
      model: "mock-football-v2",
      temperature: 0.4,
      webSearchEnabled: false,
      systemPrompt: "你是足球赛事数据分析助手，只输出合规的数据分析内容，不提供投注建议。",
      userPromptTemplate: "请根据输入赛事数据生成结构化预测草稿，包含摘要、比分、风险和分析段落。",
    },
  });
  await expect(aiSettingsResponse).toBeOK();
  const sourceSettingsResponse = await page.request.post("/api/admin/settings/match-source", {
    data: {
      provider: "api",
      apiUrl: "https://example.com/matches",
      searchModel: "gpt-5.2",
      searchPromptTemplate: "检索未来 72 小时足球赛程，返回可核验来源。",
      syncEnabled: true,
      syncCron: "每天 09:00",
    },
  });
  await expect(sourceSettingsResponse).toBeOK();
});

test("ordinary user is blocked from admin", async ({ page }) => {
  await loginByPhone(page, "13800000008");

  await expect(page.getByRole("heading", { name: "没有访问权限" })).toBeVisible();
});
