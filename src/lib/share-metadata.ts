import type { Metadata } from "next";
import { getSiteSettings, getWechatSettings } from "@/services/admin-settings";

export const defaultSiteName = "每日足球 AI 预测";
export const defaultShareTitle = "每日足球 AI 预测";
export const defaultShareDescription = "今日重点赛事、AI 数据分析、赛后复盘和风险提示，仅作数据分析参考。";

const shareImagePath = "/wechat-share-card.jpg";

export function getPublicBaseUrl() {
  const rawUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    return new URL(rawUrl).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function toAbsolutePublicUrl(value: string, baseUrl = getPublicBaseUrl()) {
  try {
    return new URL(value).toString();
  } catch {
    return new URL(value.startsWith("/") ? value : `/${value}`, baseUrl).toString();
  }
}

export function createShareMetadata({
  title = defaultShareTitle,
  description = defaultShareDescription,
  path = "/",
  siteName = defaultSiteName,
  imageUrl = shareImagePath,
}: {
  title?: string;
  description?: string;
  path?: string;
  siteName?: string;
  imageUrl?: string;
} = {}): Metadata {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName,
      locale: "zh_CN",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 600,
          height: 600,
          type: "image/jpeg",
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    other: {
      "itemprop:name": title,
      "itemprop:description": description,
      "itemprop:image": imageUrl,
      "image": imageUrl,
      "thumbnail": imageUrl,
      "og:image:secure_url": imageUrl,
      "og:image:type": "image/jpeg",
    },
  };
}

export async function createConfiguredShareMetadata({
  title,
  description,
  path = "/",
}: {
  title?: string;
  description?: string;
  path?: string;
} = {}): Promise<Metadata> {
  try {
    const [siteSettings, wechatSettings] = await Promise.all([getSiteSettings(), getWechatSettings()]);
    const baseUrl = siteSettings.publicBaseUrl || getPublicBaseUrl();
    const shareTitle = title ?? wechatSettings.shareTitle ?? defaultShareTitle;
    const shareDescription = description ?? wechatSettings.shareDescription ?? defaultShareDescription;
    const shareImageUrl = toAbsolutePublicUrl(wechatSettings.shareImageUrl || shareImagePath, baseUrl);

    return {
      metadataBase: new URL(baseUrl),
      ...createShareMetadata({
        title: shareTitle,
        description: shareDescription,
        path,
        siteName: siteSettings.siteName || defaultSiteName,
        imageUrl: shareImageUrl,
      }),
    };
  } catch {
    return createShareMetadata({ title, description, path });
  }
}
