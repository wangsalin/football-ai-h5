import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { LoginForm } from "@/components/h5/login-form";

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const redirectTo = (await searchParams).redirect ?? "/me";
  const isAdminLogin = redirectTo.startsWith("/admin");

  return (
    <AppShell>
      <header className="pt-8">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl border border-[#f6c85f]/30 bg-[#132d21] text-xl font-bold text-[#f6c85f]">
          AI
        </div>
        <p className="mt-5 text-sm font-medium text-[#9db4a5]">每日足球 AI 预测</p>
        <h1 className="mt-1 text-2xl font-bold text-[#eef7ef]">
          {isAdminLogin ? "登录管理后台" : "登录后继续查看个人内容"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#9db4a5]">
          {isAdminLogin
            ? "管理端使用账号和密码登录，登录后可进入赛事、预测、复盘、广告和系统设置。"
            : "使用手机号验证码登录，登录后可查看完整分析、收藏赛事和设置提醒。"}
        </p>
      </header>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <p className="mt-5 text-xs leading-5 text-[#6f8376]">
        本产品明确禁止赌博、跟单、代购和任何形式的投注行为；不记录投注资金或购彩行为。
      </p>
    </AppShell>
  );
}
