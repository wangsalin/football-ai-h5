import { expect, test } from "@playwright/test";

const payload = {
  match: {
    competition: "德甲",
    kickoffAt: "2026-05-29T19:30:00+08:00",
    homeTeam: "帕德博恩",
    awayTeam: "沃尔夫斯堡",
  },
  basic: {
    homeRank: 8,
    awayRank: 12,
    homeRecentForm: "胜平负胜平",
    awayRecentForm: "负平胜负平",
    motivationSummary: "主队争取更高排名，客队保级压力较小",
  },
  lineup: {
    homeInjuries: [],
    awayInjuries: [],
    scheduleImpact: "双方无欧战，体能影响较小",
  },
  odds: {
    europeanInitial: { home: 2.1, draw: 3.3, away: 3.2 },
    europeanCurrent: { home: 1.95, draw: 3.35, away: 3.6 },
    asianInitial: "主让0.25",
    asianCurrent: "主让0.5",
    goalLineInitial: "2.5",
    goalLineCurrent: "2.25",
  },
};

async function loginWithCode(page: import("@playwright/test").Page, phone: string) {
  await page.evaluate(async (loginPhone) => {
    await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: loginPhone }),
    });

    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: loginPhone, code: "123456" }),
    });
  }, phone);
}

async function loginAnalyst(page: import("@playwright/test").Page) {
  await page.request.post("/api/auth/password-login", { data: { username: "analyst", password: "analyst123456" } });
}

test("analyst can call AI draft API", async ({ page }) => {
  await page.goto("/");
  await loginAnalyst(page);

  const response = await page.request.post("/api/admin/predictions/generate-draft", { data: payload });
  await expect(response).toBeOK();
  const json = await response.json();
  expect(json.data.status).toBe("DRAFT");
  expect(json.data.saved).toBe(false);
  expect(json.data.draft.scorePicks).toHaveLength(3);
});

test("ordinary user cannot call AI draft API", async ({ page }) => {
  await page.goto("/");
  await loginWithCode(page, "13800000007");

  const response = await page.request.post("/api/admin/predictions/generate-draft", { data: payload });
  expect(response.status()).toBe(403);
});
