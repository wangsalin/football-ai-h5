"use client";

import { useEffect, useMemo, useState } from "react";
import { AdClickLink } from "@/components/ui/ad-click-link";
import type { PublicAdCampaign } from "@/services/ad-data";

type AdBannerCarouselProps = {
  campaigns: PublicAdCampaign[];
  fallback: PublicAdCampaign;
  slotCode: string;
};

export function AdBannerCarousel({ campaigns, fallback, slotCode }: AdBannerCarouselProps) {
  const items = campaigns.length > 0 ? campaigns : [fallback];
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex] ?? items[0];
  const impressionKey = useMemo(() => `ad-impressions:${slotCode}`, [slotCode]);

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    if (!active?.id) {
      return;
    }

    const recorded = new Set((window.sessionStorage.getItem(impressionKey) ?? "").split(",").filter(Boolean));
    if (recorded.has(active.id)) {
      return;
    }

    recorded.add(active.id);
    window.sessionStorage.setItem(impressionKey, Array.from(recorded).join(","));

    void fetch("/api/ads/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: active.id,
        eventType: "IMPRESSION",
        pagePath: `ad-slot:${slotCode}`,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [active?.id, impressionKey, slotCode]);

  if (!active) {
    return null;
  }

  const href = active.accountId === "fallback" ? (active.targetUrl ?? "/ads") : `/ads/${active.id}`;
  const hasImage = Boolean(active.imageUrl);
  const shellClassName = hasImage
    ? "overflow-hidden rounded-[14px] bg-[#07110d] shadow-[0_10px_28px_rgba(0,0,0,.22)]"
    : "overflow-hidden rounded-[14px] border border-[#f6c85f]/20 bg-[#07110d] shadow-[0_10px_28px_rgba(0,0,0,.22)]";

  return (
    <aside
      className={shellClassName}
      data-campaign-id={active.id}
      data-slot-code={slotCode}
    >
      <AdClickLink
        campaignId={active.id}
        className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#36d37e]"
        href={href}
        pagePath={`ad-slot:${slotCode}`}
      >
        <div className="relative aspect-[2.65/1] min-h-[128px] overflow-hidden bg-[#10261b]">
          {active.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={active.title}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
              src={active.imageUrl}
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#173b2a,#08130f_58%,#25361e)]" />
          )}

          <div
            className={
              hasImage
                ? "absolute inset-0 bg-[linear-gradient(0deg,rgba(3,10,7,.24),transparent_52%)]"
                : "absolute inset-0 bg-[linear-gradient(90deg,rgba(3,10,7,.78),rgba(3,10,7,.28)_54%,rgba(3,10,7,.08)),linear-gradient(0deg,rgba(3,10,7,.72),transparent_54%)]"
            }
          />

          <span className="absolute right-3 top-3 inline-flex h-6 items-center rounded-full border border-[#f6c85f]/55 bg-[#07110d]/75 px-2 text-[11px] leading-none text-[#f6c85f] backdrop-blur">
            广告
          </span>

          {hasImage ? <span className="sr-only">{active.title}</span> : null}

          {!hasImage ? (
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3.5">
              <div className="min-w-0 pr-2">
                <p className="truncate text-[11px] font-medium leading-4 text-[#c6d5c9]">{active.account}</p>
                <h3 className="mt-0.5 line-clamp-1 text-[17px] font-semibold leading-6 text-white">{active.title}</h3>
                {active.body ? <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-[#d9e6dc]">{active.body}</p> : null}
              </div>
              <span className="ml-auto inline-flex min-h-9 shrink-0 items-center rounded-full bg-[#f6c85f] px-4 text-xs font-semibold text-[#07110d] transition group-hover:bg-[#ffe08a]">
                查看
              </span>
            </div>
          ) : null}
        </div>
      </AdClickLink>

      {items.length > 1 ? (
        <div className="flex items-center justify-center gap-1.5 bg-[#07110d] px-3 py-2">
          {items.map((item, index) => (
            <button
              key={item.id}
              aria-label={`切换到第 ${index + 1} 个广告`}
              className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-5 bg-[#f6c85f]" : "w-1.5 bg-[#789080]"}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </aside>
  );
}
