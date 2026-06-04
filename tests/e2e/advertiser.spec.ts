import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page, phone: string, redirect = "/advertiser") {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`);
  await page.getByLabel("手机号").fill(phone);
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/auth/send-code") && response.ok()),
    page.getByRole("button", { name: "获取验证码" }).click(),
  ]);
  await page.getByLabel("验证码").fill("123456");
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login")),
    page.getByRole("button", { name: "登录 / 注册" }).click(),
  ]);
}

test("advertiser can view campaign dashboard", async ({ page }) => {
  await login(page, "13800000002");

  await expect(page.getByRole("heading", { name: "投放数据" })).toBeVisible();
  await expect(page.getByText("总曝光")).toBeVisible();
  await expect(page.getByRole("heading", { name: "广告计划" })).toBeVisible();
  await expect(page.getByRole("cell", { name: /观赛套餐/ }).first()).toBeVisible();
});

test("ordinary user cannot access advertiser dashboard", async ({ page }) => {
  await login(page, "13800000011");

  await expect(page.getByRole("heading", { name: "没有访问权限" })).toBeVisible();
});

test("ads APIs accept active lookup, events, and leads", async ({ request }) => {
  const active = await request.get("/api/ads/active?slotCode=HOME_TOP");
  await expect(active).toBeOK();
  const activeJson = await active.json();
  const campaignId = activeJson.data.campaign.id;
  expect(campaignId).toBeTruthy();

  const event = await request.post("/api/ads/events", {
    data: { campaignId, eventType: "IMPRESSION", pagePath: "/" },
  });
  await expect(event).toBeOK();
  expect((await event.json()).data.saved).toBe(true);

  const lead = await request.post("/api/ads/leads", {
    data: {
      companyName: "测试酒吧",
      contactName: "张先生",
      phone: "13800000009",
      city: "上海",
      message: "想了解详情页广告",
    },
  });
  expect(lead.status()).toBe(201);
  expect((await lead.json()).data.lead.id).toBeTruthy();

  const sensitiveLead = await request.post("/api/ads/leads", {
    data: {
      companyName: "测试酒吧",
      contactName: "张先生",
      phone: "13800000010",
      city: "上海",
      message: "希望投放投注平台广告",
    },
  });
  expect(sensitiveLead.status()).toBe(422);
});
