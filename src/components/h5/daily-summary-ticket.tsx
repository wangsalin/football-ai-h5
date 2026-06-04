import type { MatchPreview } from "@/lib/mock-data";

type DailySummaryTicketProps = {
  matches: MatchPreview[];
};

const riskText: Record<MatchPreview["riskLevel"], string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
};

const riskClass: Record<MatchPreview["riskLevel"], string> = {
  LOW: "border-[#36d37e]/35 bg-[#36d37e]/10 text-[#b8ffd5]",
  MEDIUM: "border-[#f6c85f]/35 bg-[#f6c85f]/10 text-[#ffe3a3]",
  HIGH: "border-rose-300/35 bg-rose-300/10 text-rose-100",
};

function formatNumber(index: number) {
  return String(index + 1).padStart(3, "0");
}

function SummaryLine({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="grid grid-cols-[58px_1fr] gap-2 text-sm leading-6">
      <p className="text-[#6f8376]">{label}</p>
      <p className={`min-w-0 break-words font-semibold ${highlight ? "text-[#f6c85f]" : "text-[#eef7ef]"}`}>
        {value || "待定"}
      </p>
    </div>
  );
}

export function DailySummaryTicket({ matches }: DailySummaryTicketProps) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <section className="mt-5 rounded-2xl border border-white/8 bg-[#0e1f17] p-4 shadow-[0_16px_40px_rgba(0,0,0,.22)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#f6c85f]">今日总单</p>
          <h2 className="mt-1 text-xl font-bold text-[#eef7ef]">今日{matches.length}场汇总</h2>
          <p className="mt-1 text-xs leading-5 text-[#9db4a5]">快速扫读方向，详细分析在下方逐场展开。</p>
        </div>
        <span className="shrink-0 rounded-full border border-[#f6c85f]/30 bg-[#f6c85f]/10 px-2.5 py-1 text-xs text-[#f6c85f]">
          已登录
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {matches.map((match, index) => (
          <article key={match.id} className="rounded-xl border border-white/8 bg-[#11281d] px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 min-w-9 items-center justify-center rounded-full bg-[#f6c85f]/12 px-2 text-xs font-semibold text-[#f6c85f]">
                    {formatNumber(index)}
                  </span>
                  <p className="truncate text-xs text-[#9db4a5]">
                    {match.competition} · {match.kickoffTime}
                  </p>
                </div>
                <h3 className="mt-2 truncate text-base font-semibold leading-6 text-[#eef7ef]">
                  {match.homeTeam} vs {match.awayTeam}
                </h3>
              </div>
              <span className={`inline-flex min-h-7 shrink-0 items-center rounded-full border px-2 text-xs ${riskClass[match.riskLevel]}`}>
                风险{riskText[match.riskLevel]}
              </span>
            </div>

            <div className="mt-3 space-y-1.5 border-t border-white/8 pt-3">
              <SummaryLine label="胜平负" value={match.winDrawLossPick} highlight />
              <SummaryLine label="让球" value={match.handicapPick} />
              <SummaryLine label="半全场" value={match.halfFullPick || "谨慎观察"} />
              <div className="mt-2 rounded-lg border border-[#f6c85f]/20 bg-[#f6c85f]/8 px-3 py-2">
                <SummaryLine label="比分" value={match.scorePicks.join(" / ")} highlight />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
