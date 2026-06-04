import { expect, test } from "@playwright/test";

test("user can login, manage match preferences, and logout", async ({ page }) => {
  await page.goto("/login?redirect=/me");

  await expect(page.getByRole("heading", { name: "登录后继续查看个人内容" })).toBeVisible();

  await page.getByLabel("手机号").fill("13800000006");
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/auth/send-code") && response.ok()),
    page.getByRole("button", { name: "获取验证码" }).click(),
  ]);

  await page.getByLabel("验证码").fill("123456");
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/me"),
    page.getByRole("button", { name: "登录 / 注册" }).click(),
  ]);

  await expect(page.getByRole("heading", { name: "我的内容" })).toBeVisible();
  await expect(page.getByText("138****0006")).toBeVisible();
  await expect(page.getByText("收藏比赛")).toBeVisible();

  await page.goto("/matches");
  const matchHref = await page.locator('a[href^="/matches/"]').first().getAttribute("href");
  expect(matchHref).toBeTruthy();
  await page.goto(matchHref!);
  await expect(page.getByTestId("favorite-toggle")).toBeVisible();

  const favoriteButton = page.getByTestId("favorite-toggle");
  if ((await favoriteButton.innerText()).includes("已收藏")) {
    await favoriteButton.click();
    await expect(page.getByText("已取消收藏")).toBeVisible();
  }
  await favoriteButton.click();
  await expect(page.getByText("已收藏比赛")).toBeVisible();

  const reminderButton = page.getByTestId("reminder-toggle");
  if ((await reminderButton.innerText()).includes("已提醒")) {
    await reminderButton.click();
    await expect(page.getByText("已取消提醒")).toBeVisible();
  }
  await reminderButton.click();
  await expect(page.getByText("已设置开赛前 30 分钟提醒")).toBeVisible();

  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "我的内容" })).toBeVisible();
  await expect(page.getByText("收藏和开赛提醒已接入真实写入")).toBeVisible();

  await page.getByRole("button", { name: "退出登录" }).click();
  await expect(page.getByRole("heading", { name: "今日重点赛事" })).toBeVisible();
});
