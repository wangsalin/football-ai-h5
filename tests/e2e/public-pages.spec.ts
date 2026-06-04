import { expect, test } from "@playwright/test";

test("public match pages are browsable", async ({ page }) => {
  await page.goto("/matches");

  await expect(page.getByRole("heading", { name: "比赛列表" })).toBeVisible();
  await expect(page.getByText("帕德博恩 vs 沃尔夫斯堡")).toBeVisible();

  await page.getByRole("link", { name: "查看帕德博恩对沃尔夫斯堡分析" }).click();

  await expect(page.getByRole("heading", { name: "帕德博恩 vs 沃尔夫斯堡" })).toBeVisible();
  await expect(page.getByText("输出建议")).toBeVisible();
  await expect(page.getByText("不承诺任何收益")).toBeVisible();
});

test("reviews and ads pages render key content", async ({ page }) => {
  await page.goto("/reviews");

  await expect(page.getByRole("heading", { name: "昨日分析复盘" })).toBeVisible();
  await expect(page.getByText("错因").first()).toBeVisible();
  await expect(page.getByRole("complementary").getByText("广告")).toBeVisible();

  await expect(page.getByText("不构成投注建议")).toBeVisible();

  await page.goto("/ads");

  await expect(page.getByRole("heading", { name: "触达本地看球人群" })).toBeVisible();
  await expect(page.getByText("基础曝光包")).toBeVisible();
  await expect(page.getByRole("button", { name: "提交合作意向" })).toBeVisible();
});
