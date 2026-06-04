import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WechatShareBridge } from "@/components/wechat/wechat-share-bridge";
import {
  createConfiguredShareMetadata,
  createShareMetadata,
  defaultShareTitle,
  defaultSiteName,
  getPublicBaseUrl,
} from "@/lib/share-metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await createConfiguredShareMetadata();
  const siteName =
    typeof metadata.openGraph?.siteName === "string" && metadata.openGraph.siteName ? metadata.openGraph.siteName : defaultSiteName;
  const title = typeof metadata.title === "string" && metadata.title ? metadata.title : defaultShareTitle;

  return {
    metadataBase: new URL(getPublicBaseUrl()),
    ...createShareMetadata(),
    ...metadata,
    applicationName: siteName,
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <WechatShareBridge />
      </body>
    </html>
  );
}
