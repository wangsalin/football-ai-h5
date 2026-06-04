"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChartNoAxesColumn, CircleUserRound, ClipboardList, Handshake, Home } from "lucide-react";

const tabs = [
  { href: "/", label: "首页", icon: Home },
  { href: "/matches", label: "分析", icon: ChartNoAxesColumn },
  { href: "/reviews", label: "复盘", icon: ClipboardList },
  { href: "/ads", label: "广告", icon: Handshake },
  { href: "/me", label: "我的", icon: CircleUserRound },
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-white/10 bg-[#07110d]/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6c85f] ${
                active ? "bg-[#132d21] text-[#f6c85f]" : "text-[#9db4a5] hover:text-[#eef7ef]"
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
