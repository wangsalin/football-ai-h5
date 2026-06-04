import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Disclaimer } from "@/components/h5/disclaimer";
import { MatchPreferenceActions } from "@/components/h5/match-preference-actions";
import { PageHeader } from "@/components/h5/page-header";
import { AdSlot } from "@/components/ui/ad-slot";
import { RiskBadge } from "@/components/ui/risk-badge";
import { getCurrentUser } from "@/lib/auth";
import { matches } from "@/lib/mock-data";
import { createConfiguredShareMetadata } from "@/lib/share-metadata";
import { matchStatusText } from "@/lib/status";
import { getPublicMatchById } from "@/services/public-data";
import { getUserMatchPreferences } from "@/services/user-preferences";

type MatchDetailPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return matches.map((match) => ({ id: match.id }));
}

export async function generateMetadata({ params }: MatchDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  return createConfiguredShareMetadata({
    title: "赛事分析",
    description: "登录后查看中国体彩竞彩足球 AI 分析、风险提示和赛前倾向。",
    path: `/matches/${id}`,
  });
}

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { id } = await params;
  const [match, user] = await Promise.all([getPublicMatchById(id), getCurrentUser()]);

  if (!match) {
    notFound();
  }

  if (!user) {
    redirect(`/login?redirect=/matches/${id}`);
  }

  const preferences = await getUserMatchPreferences(user.id, id);
  const confidencePercent = Math.max(0, Math.min(100, Math.round(match.confidence * 10)));

  return (
    <AppShell>
      <PageHeader
        eyebrow={`${match.competition} · ${match.date}`}
        title={`${match.homeTeam} vs ${match.awayTeam}`}
        description={`${match.kickoffTime} 开赛 · ${matchStatusText[match.status]}`}
        action={<RiskBadge level={match.riskLevel} />}
      />

      <section className="mt-5 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
        <div className="flex items-center gap-2 text-sm text-[#f6c85f]">
          <Clock size={17} aria-hidden="true" />
          <span>AI 综合倾向</span>
        </div>
        <p className="mt-3 text-base font-semibold leading-7 text-[#eef7ef]">{match.summary}</p>

        <div className="mt-4 space-y-2">
          <div className="rounded-2xl border border-[#f6c85f]/24 bg-[#132d21] p-3">
            <p className="text-[11px] leading-4 text-[#9db4a5]">胜平负主结论</p>
            <p className="mt-1 text-lg font-semibold leading-7 text-[#f6c85f]">{match.winDrawLossPick}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/8 bg-[#132d21] p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[11px] leading-4 text-[#9db4a5]">信心指数</p>
                <p className="text-base font-semibold text-[#eef7ef]">{match.confidence}/10</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#07110d]">
                <div className="h-full rounded-full bg-[#36d37e]" style={{ width: `${confidencePercent}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-[#132d21] p-3">
              <p className="text-[11px] leading-4 text-[#9db4a5]">总进球</p>
              <p className="mt-2 text-base font-semibold leading-6 text-[#eef7ef]">{match.totalGoalsPick}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-white/8 bg-[#11281d] p-4">
        <h2 className="text-base font-semibold text-[#eef7ef]">输出建议</h2>
        <dl className="mt-3 space-y-2 text-sm">
          {[
            ["让球胜平负", match.handicapPick],
            ["比分建议", match.scorePicks.join("、")],
            ["半全场推荐", match.halfFullPick || "谨慎观望"],
            ["冷门预警", match.coldAlertReason],
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-[88px_1fr] gap-3">
              <dt className="text-[#9db4a5]">{label}</dt>
              <dd className="leading-6 text-[#eef7ef]">{value}</dd>
            </div>
          ))}
        </dl>
        <MatchPreferenceActions
          matchId={id}
          isAuthenticated={Boolean(user)}
          initialFavorite={preferences.isFavorite}
          initialReminder={preferences.hasReminder}
        />
      </section>

      <section className="mt-4 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
        <h2 className="text-base font-semibold text-[#eef7ef]">赔率变化</h2>
        <div className="mt-3 grid gap-2 text-sm">
          {[
            ["欧赔初始", match.odds.europeanInitial],
            ["欧赔即时", match.odds.europeanCurrent],
            ["亚盘初始", match.odds.asianInitial],
            ["亚盘即时", match.odds.asianCurrent],
            ["大小球", `${match.odds.goalLineInitial} → ${match.odds.goalLineCurrent}`],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-xl bg-[#132d21] px-3 py-2">
              <span className="text-[#9db4a5]">{label}</span>
              <span className="font-medium text-[#eef7ef]">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4">
        <AdSlot title="绿茵球馆包场" body="详情页贴片广告，面向正在查看单场分析的看球用户。" />
      </div>

      <section className="mt-4 space-y-3">
        {match.sections.map((section, index) => (
          <details
            key={section.key}
            className="rounded-2xl border border-white/8 bg-[#11281d] p-4 open:border-[#f6c85f]/30"
            open={index === 0 || section.key === "risk"}
          >
            <summary className="cursor-pointer text-base font-semibold text-[#eef7ef]">{section.title}</summary>
            <p className="mt-3 text-sm leading-6 text-[#c7d7ca]">{section.content}</p>
          </details>
        ))}
      </section>

      <div className="mt-5">
        <Disclaimer />
      </div>
    </AppShell>
  );
}
