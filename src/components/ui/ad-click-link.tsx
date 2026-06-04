"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type AdClickLinkProps = {
  campaignId?: string;
  href: string;
  pagePath?: string;
  className?: string;
  children: ReactNode;
  external?: boolean;
};

export function AdClickLink({ campaignId, href, pagePath, className, children, external = false }: AdClickLinkProps) {
  function recordClick() {
    if (!campaignId) {
      return;
    }

    void fetch("/api/ads/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId,
        eventType: "CLICK",
        pagePath: pagePath ?? href,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  if (external) {
    return (
      <a className={className} href={href} onClick={recordClick} rel="noreferrer nofollow sponsored" target="_blank">
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href} onClick={recordClick} rel="sponsored">
      {children}
    </Link>
  );
}
