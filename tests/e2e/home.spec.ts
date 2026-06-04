import { expect, test } from "@playwright/test";

test("home page shows featured matches and disclaimer", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "今日重点赛事" })).toBeVisible();
  await expect(page.getByText("帕德博恩 vs 沃尔夫斯堡")).toBeVisible();
  await expect(page.getByRole("complementary").getByText("广告")).toBeVisible();
  await expect(page.getByText("不构成投注建议")).toBeVisible();
});
