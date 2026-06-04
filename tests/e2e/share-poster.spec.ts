import { expect, test } from "@playwright/test";

test("user can generate today's share poster", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "生成海报" }).click();

  await expect(page.getByLabel("今日赛事分享海报")).toBeVisible();
  await expect(page.getByText("今日精选 3 场")).toBeVisible();
  await expect(page.getByLabel("今日赛事分享海报").getByText("帕德博恩 vs 沃尔夫斯堡")).toBeVisible();
  await expect(page.getByLabel("今日赛事分享海报").getByText("广告")).toBeVisible();
  await expect(page.getByLabel("今日赛事分享海报").getByText("不构成投注建议")).toBeVisible();
});
