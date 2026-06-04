import { CalendarDays, ShieldAlert, UserRound } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MatchCard } from "@/components/h5/match-card";
import { SharePoster } from "@/components/h5/share-poster";
import { AdSlot } from "@/components/ui/ad-slot";
import { getCurrentUser } from "@/lib/auth";
import { createConfiguredShareMetadata } from "@/lib/share-metadata";
import { disclaimer } from "@/lib/status";
import { getChinaTodayLabel, getTodayMatches } from "@/services/public-data";

export async function generateMetadata() {
  return createConfiguredShareMetadata({
  title: "每日足球 AI 预测",
  description: "今日中国体彩竞彩足球赛事、AI 数据分析、赛前倾向和风险提示，仅作数据分析参考。",
  path: "/",
  });
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const [todayMatches, user] = await Promise.all([getTodayMatches(), getCurrentUser()]);
  const canViewAnalysis = Boolean(user);
  const previewCount = todayMatches.length > 0 ? Math.max(1, Math.floor(todayMatches.length / 4)) : 0;
  const previewMatches = todayMatches.slice(0, previewCount);
  const todayLabel = getChinaTodayLabel();
  const analyzedCount = todayMatches.filter((match) => match.winDrawLossPick !== "待定").length;
  const liveCount = todayMatches.filter((match) => match.status === "LIVE").length;
  const dashboardStats = [
    { label: "今日比赛", value: `${todayMatches.length}`, hint: "全部体彩竞彩" },
    { label: "已分析", value: `${analyzedCount}`, hint: "登录后查看" },
    { label: "进行中", value: `${liveCount}`, hint: "实时状态" },
  ];

  return (
    <AppShell>
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#9db4a5]">每日足球 AI 预测</p>
          <h1 className="mt-1 text-2xl font-bold tracking-normal text-[#eef7ef]">今日体彩赛事</h1>
        </div>
        <Link
          href="/login"
          className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-[#0e1f17] text-[#f6c85f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6c85f]"
          aria-label="登录"
        >
          <UserRound size={20} aria-hidden="true" />
        </Link>
      </header>

      <section className="mt-5 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
        <div className="flex items-center gap-2 text-sm text-[#f6c85f]">
          <CalendarDays size={17} aria-hidden="true" />
          <span>{todayLabel}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#c7d7ca]">
          首页展示今日体彩赛事的部分场次和比分倾向，完整分析需登录后查看。AI 分析只做数据参考。
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {dashboardStats.map((item) => (
            <div key={item.label} className="rounded-xl bg-[#132d21] p-3">
              <p className="text-[11px] text-[#9db4a5]">{item.label}</p>
              <p className="mt-1 text-lg font-semibold text-[#eef7ef]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4">
        <AdSlot title="城南精酿观赛夜" body="焦点赛事大屏直播，双人套餐限时预约。" />
      </div>

      <SharePoster matches={previewMatches} canViewAnalysis={canViewAnalysis} />

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#eef7ef]">今日试看</h2>
          <Link
            href="/matches"
            className="text-sm font-medium text-[#36d37e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6c85f]"
          >
            登录看全部
          </Link>
        </div>
        {todayMatches.length > 0 ? (
          <p className="mb-3 text-xs leading-5 text-[#9db4a5]">
            今日共 {todayMatches.length} 场，首页展示 {previewMatches.length} 场；完整分析和全部赛事登录后查看。
          </p>
        ) : null}
        <div className="space-y-3">
          {previewMatches.length > 0 ? (
            previewMatches.map((match) => (
              <MatchCard key={match.id} match={match} canViewAnalysis={canViewAnalysis} showScorePreview />
            ))
          ) : (
            <div className="rounded-2xl border border-white/8 bg-[#11281d] p-4">
              <p className="text-sm font-semibold text-[#eef7ef]">今日暂无中国体彩竞彩足球赛事</p>
              <p className="mt-2 text-xs leading-5 text-[#9db4a5]">
                系统只展示可核验的体彩/竞彩赛程；如果后台刚同步，请稍后刷新。
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="mt-6 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 shrink-0 text-[#f6c85f]" size={18} aria-hidden="true" />
          <p className="text-xs leading-5 text-[#9db4a5]">{disclaimer}</p>
        </div>
      </footer>
    </AppShell>
  );
}
