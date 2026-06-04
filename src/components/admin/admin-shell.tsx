import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, ClipboardCheck, FileText, Megaphone, Settings, Shield, Trophy, Users } from "lucide-react";
import type { AppUser } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "概览", icon: BarChart3 },
  { href: "/admin/users", label: "用户", icon: Users },
  { href: "/admin/matches", label: "赛事", icon: Trophy },
  { href: "/admin/predictions", label: "预测", icon: FileText },
  { href: "/admin/reviews", label: "复盘", icon: ClipboardCheck },
  { href: "/admin/ads", label: "广告", icon: Megaphone },
  { href: "/admin/settings", label: "设置", icon: Settings },
];

type AdminShellProps = {
  children: ReactNode;
  title: string;
  description?: string;
  user: AppUser;
};

export function AdminShell({ children, title, description, user }: AdminShellProps) {
  return (
    <div className="min-h-dvh bg-[#06100c] text-[#eef7ef]">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-4 md:px-6">
        <header className="rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-[#f6c85f]">
                <Shield size={17} aria-hidden="true" />
                管理后台
              </div>
              <h1 className="mt-2 text-2xl font-bold text-[#eef7ef]">{title}</h1>
              {description ? <p className="mt-2 text-sm leading-6 text-[#9db4a5]">{description}</p> : null}
            </div>
            <div className="rounded-xl border border-white/10 bg-[#07110d] px-3 py-2 text-sm">
              <p className="font-semibold text-[#eef7ef]">{user.nickname}</p>
              <p className="mt-1 text-xs text-[#9db4a5]">{user.role}</p>
            </div>
          </div>
        </header>

        <nav className="mt-4 flex gap-2 overflow-x-auto rounded-2xl border border-white/8 bg-[#0e1f17] p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#c7d7ca] hover:bg-[#132d21] hover:text-[#f6c85f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6c85f]"
                href={item.href}
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="mt-4 min-w-0 flex-1 pb-8">{children}</main>
      </div>
    </div>
  );
}
