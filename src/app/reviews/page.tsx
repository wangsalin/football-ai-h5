import { CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Disclaimer } from "@/components/h5/disclaimer";
import { PageHeader } from "@/components/h5/page-header";
import { AdSlot } from "@/components/ui/ad-slot";
import { StatCard } from "@/components/ui/stat-card";
import { createConfiguredShareMetadata } from "@/lib/share-metadata";
import { getChinaYesterdayLabel, getPublicReviews } from "@/services/public-data";

export async function generateMetadata() {
  return createConfiguredShareMetadata({
    title: "昨日复盘",
    description: "查看昨日中国体彩竞彩足球赛事的 AI 自动复盘、命中情况和偏差原因。",
    path: "/reviews",
  });
}

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await getPublicReviews();
  const hitCount = reviews.filter((review) => review.resultType === "HIT").length;
  const partialCount = reviews.filter((review) => review.resultType === "PARTIAL").length;
  const missCount = reviews.filter((review) => review.resultType === "MISS").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow={getChinaYesterdayLabel()}
        title="昨日比赛复盘"
        description="只复盘昨日已完赛的中国体彩竞彩足球赛事，命中和偏差都会展示。"
      />

      <section className="mt-5 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="命中" value={`${hitCount} 场`} />
          <StatCard label="部分" value={`${partialCount} 场`} />
          <StatCard label="偏差" value={`${missCount} 场`} />
        </div>
      </section>

      <div className="mt-4">
        <AdSlot title="复盘页品牌曝光" body="稳定触达长期关注赛后表现的用户，适合本地品牌持续露出。" />
      </div>

      <section className="mt-5 space-y-3">
        {reviews.length > 0 ? (
          reviews.map((review) => {
            const hit = review.resultType === "HIT";
            const partial = review.resultType === "PARTIAL";
            return (
              <article key={review.id} className="rounded-2xl border border-white/8 bg-[#11281d] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#9db4a5]">{review.competition}</p>
                    <h2 className="mt-1 text-lg font-semibold text-[#eef7ef]">{review.teams}</h2>
                  </div>
                  <span
                    className={`inline-flex min-h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold ${
                      hit
                        ? "border-[#36d37e]/40 bg-[#36d37e]/12 text-[#b8ffd5]"
                        : partial
                          ? "border-[#f6c85f]/40 bg-[#f6c85f]/12 text-[#fff5cf]"
                          : "border-[#ff6675]/40 bg-[#ff6675]/12 text-[#ffc2c8]"
                    }`}
                  >
                    {hit ? <CheckCircle2 size={14} aria-hidden="true" /> : <XCircle size={14} aria-hidden="true" />}
                    {hit ? "命中" : partial ? "部分" : "偏差"}
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="grid grid-cols-[72px_1fr] gap-3">
                    <dt className="text-[#9db4a5]">预测</dt>
                    <dd className="leading-6 text-[#eef7ef]">{review.predicted}</dd>
                  </div>
                  <div className="grid grid-cols-[72px_1fr] gap-3">
                    <dt className="text-[#9db4a5]">赛果</dt>
                    <dd className="leading-6 text-[#f6c85f]">{review.actualResult}</dd>
                  </div>
                  <div className="grid grid-cols-[72px_1fr] gap-3">
                    <dt className="text-[#9db4a5]">复盘</dt>
                    <dd className="leading-6 text-[#c7d7ca]">{review.hitSummary}</dd>
                  </div>
                  {review.missReason ? (
                    <div className="grid grid-cols-[72px_1fr] gap-3">
                      <dt className="text-[#9db4a5]">错因</dt>
                      <dd className="leading-6 text-[#ffc2c8]">{review.missReason}</dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-white/8 bg-[#11281d] p-4">
            <p className="text-sm font-semibold text-[#eef7ef]">昨日暂无已发布复盘</p>
            <p className="mt-2 text-xs leading-5 text-[#9db4a5]">
              复盘任务会在比赛完赛并有比分后生成；如果刚到复盘时间，请稍后刷新。
            </p>
          </div>
        )}
      </section>

      <div className="mt-5">
        <Disclaimer />
      </div>
    </AppShell>
  );
}
