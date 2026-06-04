"use client";

import { useEffect } from "react";

type WechatConfigResponse = {
  ok: boolean;
  data?: {
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
    share: {
      title: string;
      desc: string;
      link: string;
      imgUrl: string;
    };
  };
};

type WechatSdk = {
  config: (config: {
    debug: boolean;
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
    jsApiList: string[];
  }) => void;
  ready: (callback: () => void) => void;
  error: (callback: () => void) => void;
  updateAppMessageShareData?: (share: { title: string; desc: string; link: string; imgUrl: string }) => void;
  updateTimelineShareData?: (share: { title: string; link: string; imgUrl: string }) => void;
  onMenuShareAppMessage?: (share: { title: string; desc: string; link: string; imgUrl: string }) => void;
  onMenuShareTimeline?: (share: { title: string; link: string; imgUrl: string }) => void;
};

declare global {
  interface Window {
    wx?: WechatSdk;
  }
}

let sdkPromise: Promise<void> | null = null;

function isWechatBrowser() {
  return /MicroMessenger/i.test(window.navigator.userAgent);
}

function loadWechatSdk() {
  if (window.wx) {
    return Promise.resolve();
  }

  sdkPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("wechat sdk load failed")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("wechat sdk load failed"));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

export function WechatShareBridge() {
  useEffect(() => {
    if (!isWechatBrowser()) {
      return;
    }

    const pageUrl = window.location.href.split("#")[0];
    let cancelled = false;

    async function configureShare() {
      try {
        const response = await fetch(`/api/wechat/share-signature?url=${encodeURIComponent(pageUrl)}`, {
          cache: "no-store",
        });
        const result = (await response.json().catch(() => null)) as WechatConfigResponse | null;
        if (!result?.ok || !result.data || cancelled) {
          return;
        }

        await loadWechatSdk();
        if (!window.wx || cancelled) {
          return;
        }

        const { appId, timestamp, nonceStr, signature, share } = result.data;
        window.wx.config({
          debug: false,
          appId,
          timestamp,
          nonceStr,
          signature,
          jsApiList: ["updateAppMessageShareData", "updateTimelineShareData", "onMenuShareAppMessage", "onMenuShareTimeline"],
        });

        window.wx.ready(() => {
          window.wx?.updateAppMessageShareData?.(share);
          window.wx?.updateTimelineShareData?.({
            title: share.title,
            link: share.link,
            imgUrl: share.imgUrl,
          });
          window.wx?.onMenuShareAppMessage?.(share);
          window.wx?.onMenuShareTimeline?.({
            title: share.title,
            link: share.link,
            imgUrl: share.imgUrl,
          });
        });

        window.wx.error(() => undefined);
      } catch {
        // Meta tags still provide a fallback share card when JS-SDK is unavailable.
      }
    }

    void configureShare();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
