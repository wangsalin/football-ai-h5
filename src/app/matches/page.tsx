import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MatchCard } from "@/components/h5/match-card";
import { PageHeader } from "@/components/h5/page-header";
import { AdSlot } from "@/components/ui/ad-slot";
import { getCurrentUser } from "@/lib/auth";
import { createConfiguredShareMetadata } from "@/lib/share-metadata";
import { getPublicMatches } from "@/services/public-data";

const filters = ["今天", "明天", "低风险", "竞彩", "已分析"];

export async function generateMetadata() {
  return createConfiguredShareMetadata({
    title: "分析列表",
    description: "登录后点击每场比赛进入独立分析页，查看中国体彩竞彩足球赛事 AI 完整分析。",
    path: "/matches",
  });
}

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const [matches, user] = await Promise.all([getPublicMatches(), getCurrentUser()]);
  const canViewAnalysis = Boolean(user);

  return (
    <AppShell>
      <PageHeader
        eyebrow="中国体彩竞彩足球"
        title="分析列表"
        description={canViewAnalysis ? "点击每场比赛的分析按钮，进入单独分析页查看完整内容。" : "登录后点击每场比赛进入单独分析页查看完整内容。"}
      />

      <section className="mt-5 rounded-2xl border border-white/8 bg-[#0e1f17] p-3">
        <label className="sr-only" htmlFor="match-search">
          搜索球队
        </label>
        <div className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#07110d] px-3 text-[#9db4a5]">
          <Search size={17} aria-hidden="true" />
          <input
            id="match-search"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#eef7ef] outline-none placeholder:text-[#6f8376]"
            placeholder="搜索球队或联赛"
            type="search"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter, index) => (
            <button
              key={filter}
              className={`min-h-9 shrink-0 rounded-full border px-3 text-sm ${
                index === 0
                  ? "border-[#36d37e]/50 bg-[#36d37e]/15 text-[#b8ffd5]"
                  : "border-white/10 bg-[#132d21] text-[#9db4a5]"
              }`}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-4">
        <AdSlot title="夜猫烧烤观赛位" body="首页和列表页组合曝光，适合赛前 3 小时预约转化。" />
      </div>

      <section className="mt-5 space-y-3">
        {matches.length > 0 ? (
          matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              canViewAnalysis={canViewAnalysis}
              showSummaryPreview={canViewAnalysis}
              showScorePreview={canViewAnalysis}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-white/8 bg-[#11281d] p-4">
            <p className="text-sm font-semibold text-[#eef7ef]">暂无可展示的竞彩赛事</p>
            <p className="mt-2 text-xs leading-5 text-[#9db4a5]">请先在后台同步中国体彩竞彩足球赛程并生成分析。</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
