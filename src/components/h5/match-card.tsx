import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { MatchPreview } from "@/lib/mock-data";
import { matchStatusText } from "@/lib/status";
import { RiskBadge } from "@/components/ui/risk-badge";

type MatchCardProps = {
  match: MatchPreview;
  canViewAnalysis?: boolean;
  showScorePreview?: boolean;
  showSummaryPreview?: boolean;
  showFullAnalysis?: boolean;
};

export function MatchCard({
  match,
  canViewAnalysis = false,
  showScorePreview = false,
  showSummaryPreview = true,
  showFullAnalysis = false,
}: MatchCardProps) {
  const detailHref = canViewAnalysis ? `/matches/${match.id}` : `/login?redirect=/matches/${match.id}`;
  const shouldShowFullAnalysis = canViewAnalysis && showFullAnalysis;

  const summaryBlock = showSummaryPreview ? (
    canViewAnalysis ? (
      <p className="text-sm leading-6 text-[#c7d7ca]">{match.summary}</p>
    ) : (
      <p className="rounded-xl border border-white/8 bg-[#0e1f17] px-3 py-2 text-sm leading-6 text-[#9db4a5]">
        登录后查看完整赛前分析。
      </p>
    )
  ) : (
    <p className="rounded-xl border border-white/8 bg-[#0e1f17] px-3 py-2 text-sm leading-6 text-[#9db4a5]">
      完整分析和风险提示请登录后查看。
    </p>
  );

  return (
    <article className="rounded-2xl border border-white/8 bg-[#11281d] p-4 shadow-[0_16px_40px_rgba(0,0,0,.24)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#9db4a5]">
            <span>{match.competition}</span>
            <span>{match.kickoffTime}</span>
            <span>{matchStatusText[match.status]}</span>
          </div>
          <h2 className="mt-2 text-lg font-semibold text-[#eef7ef]">
            {match.homeTeam} vs {match.awayTeam}
          </h2>
        </div>
        <RiskBadge level={match.riskLevel} />
      </div>

      {summaryBlock}

      {shouldShowFullAnalysis ? (
        <div className="mt-4 space-y-3">
          <div className="space-y-2 text-sm">
            {[
              ["胜平负", match.winDrawLossPick],
              ["让球", match.handicapPick],
              ["总进球", match.totalGoalsPick],
              ["半全场推荐", match.halfFullPick || "谨慎观望"],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[68px_1fr] gap-3 rounded-xl border border-white/8 bg-[#0e1f17] px-3 py-2">
                <p className="text-[11px] leading-4 text-[#9db4a5]">{label}</p>
                <p className="text-sm font-semibold leading-6 text-[#eef7ef]">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#f6c85f]/20 bg-[#f6c85f]/8 px-3 py-2">
            <p className="text-[11px] leading-4 text-[#9db4a5]">比分倾向</p>
            <p className="mt-1 text-base font-semibold leading-6 text-[#f6c85f]">{match.scorePicks.join(" / ")}</p>
          </div>

          {match.coldAlertReason ? (
            <div className="rounded-xl border border-rose-300/20 bg-rose-300/8 px-3 py-2">
              <p className="text-[11px] leading-4 text-rose-100/75">风险提示</p>
              <p className="mt-1 text-sm leading-6 text-rose-50">{match.coldAlertReason}</p>
            </div>
          ) : null}

          {match.sections.length > 0 ? (
            <div className="space-y-2">
              {match.sections.map((section) => (
                <section key={section.key} className="rounded-xl border border-white/8 bg-[#0e1f17] px-3 py-3">
                  <h3 className="text-sm font-semibold leading-5 text-[#eef7ef]">{section.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#c7d7ca]">{section.content}</p>
                </section>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3">
          <div>
            {showScorePreview ? (
              <>
                <p className="text-xs text-[#9db4a5]">比分倾向</p>
                <p className="mt-1 text-base font-semibold text-[#f6c85f]">{match.scorePicks.join(" / ")}</p>
              </>
            ) : (
              <>
                <p className="text-xs text-[#9db4a5]">{canViewAnalysis ? "详情内容" : "分析权限"}</p>
                <p className="mt-1 text-base font-semibold text-[#f6c85f]">
                  {canViewAnalysis ? "点击查看" : "登录可见"}
                </p>
              </>
            )}
          </div>
          <Link
            className="inline-flex min-h-11 items-center gap-1 rounded-full bg-[#36d37e] px-4 text-sm font-semibold text-[#07110d] transition hover:bg-[#5de697] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6c85f]"
            href={detailHref}
            aria-label={`${canViewAnalysis ? "查看" : "登录查看"}${match.homeTeam}对${match.awayTeam}分析`}
          >
            {canViewAnalysis ? "分析" : "登录查看"}
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}
    </article>
  );
}
