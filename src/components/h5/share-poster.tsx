"use client";

import { useState } from "react";
import { Download, ImageDown } from "lucide-react";
import { featuredMatches as fallbackFeaturedMatches, type MatchPreview } from "@/lib/mock-data";
import { disclaimer, riskText } from "@/lib/status";

type SharePosterProps = {
  matches?: MatchPreview[];
  canViewAnalysis?: boolean;
};

export function SharePoster({ matches = fallbackFeaturedMatches, canViewAnalysis = false }: SharePosterProps) {
  const [visible, setVisible] = useState(false);
  const posterMatches = matches;

  return (
    <section className="mt-5 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#eef7ef]">今日海报</h2>
          <p className="mt-1 text-xs leading-5 text-[#9db4a5]">
            {canViewAnalysis ? "今日全部赛事、风险等级和广告位。" : "登录后生成含完整分析的分享海报。"}
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#36d37e] px-3 text-sm font-semibold text-[#07110d]"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          <ImageDown size={16} aria-hidden="true" />
          {visible ? "收起" : "生成海报"}
        </button>
      </div>

      {visible ? (
        <div className="mt-4">
          <article
            aria-label="今日赛事分享海报"
            className="aspect-[9/16] overflow-hidden rounded-2xl border border-[#f6c85f]/25 bg-[#07110d] p-4 shadow-[0_20px_60px_rgba(0,0,0,.35)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#9db4a5]">每日足球 AI 预测</p>
                <h3 className="mt-1 text-xl font-bold leading-7 text-[#eef7ef]">今日全部赛事</h3>
              </div>
              <div className="rounded-full border border-[#f6c85f]/35 px-3 py-1 text-xs font-semibold text-[#f6c85f]">
                2026-05-29
              </div>
            </div>

            <div className="mt-4 max-h-[56%] space-y-2 overflow-y-auto pr-1">
              {posterMatches.map((match, index) => (
                <div key={match.id} className="rounded-xl bg-[#132d21] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-[#9db4a5]">
                      {index + 1}. {match.competition} · {match.kickoffTime}
                    </span>
                    <span className="rounded-full border border-[#f6c85f]/30 px-2 py-0.5 text-[11px] text-[#f6c85f]">
                      风险{riskText[match.riskLevel]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-[#eef7ef]">
                    {match.homeTeam} vs {match.awayTeam}
                  </p>
                  {canViewAnalysis ? (
                    <>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#c7d7ca]">{match.summary}</p>
                      <p className="mt-1.5 text-xs font-semibold text-[#f6c85f]">
                        比分倾向：{match.scorePicks.join(" / ")}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1.5 rounded-lg border border-white/8 bg-[#0e1f17] px-2 py-1.5 text-xs leading-5 text-[#9db4a5]">
                      完整 AI 分析登录后可见
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-[#f6c85f]/25 bg-[#0e1f17] p-3">
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#f6c85f]">城南精酿观赛夜</span>
                <span className="rounded-full border border-[#f6c85f]/40 px-2 py-0.5 text-[11px] text-[#f6c85f]">
                  广告
                </span>
              </div>
              <p className="text-xs leading-5 text-[#c7d7ca]">焦点赛事大屏直播，双人套餐限时预约。</p>
            </div>

            <p className="mt-2 text-[10px] leading-4 text-[#789080]">{disclaimer}</p>
          </article>

          <button
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#07110d] text-sm font-semibold text-[#c7d7ca]"
            type="button"
          >
            <Download size={16} aria-hidden="true" />
            长按海报保存
          </button>
        </div>
      ) : null}
    </section>
  );
}
