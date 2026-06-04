import { redirect } from "next/navigation";
import { Bell, Bookmark, Clock, ShieldCheck, Star, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LogoutButton } from "@/components/h5/logout-button";
import { PageHeader } from "@/components/h5/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getCurrentUser, maskPhone } from "@/lib/auth";
import { getUserProfileData } from "@/services/me-data";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/me");
  }

  const profile = await getUserProfileData(user.id);
  const profileItems = [
    { icon: Bookmark, label: "收藏比赛", value: `${profile.favoriteCount} 场`, hint: profile.favoriteHint },
    { icon: Bell, label: "开赛提醒", value: `${profile.reminderCount} 条`, hint: profile.reminderHint },
    { icon: Star, label: "关注球队", value: `${profile.followedTeamCount} 支`, hint: profile.followedTeamHint },
    { icon: Clock, label: "浏览记录", value: `${profile.historyCount} 条`, hint: profile.historyHint },
  ];

  return (
    <AppShell>
      <PageHeader eyebrow="个人中心" title="我的内容" description="管理收藏、提醒、关注球队和浏览记录。" />

      <section className="mt-5 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#132d21] text-[#f6c85f]">
            <UserRound size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[#eef7ef]">{user.nickname}</h2>
            <p className="mt-1 text-sm text-[#9db4a5]">{maskPhone(user.phone)}</p>
          </div>
          <span className="ml-auto rounded-full border border-[#36d37e]/30 bg-[#36d37e]/10 px-2.5 py-1 text-xs font-semibold text-[#b8ffd5]">
            {user.role}
          </span>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2">
        <StatCard label="收藏" value={`${profile.favoriteCount}`} />
        <StatCard label="提醒" value={`${profile.reminderCount}`} />
      </section>

      <section className="mt-5 space-y-3">
        {profileItems.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-[#11281d] p-4">
              <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0e1f17] text-[#f6c85f]">
                <Icon size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-[#eef7ef]">{item.label}</h3>
                <p className="mt-1 truncate text-xs text-[#9db4a5]">{item.hint}</p>
              </div>
              <span className="text-sm font-semibold text-[#36d37e]">{item.value}</span>
            </article>
          );
        })}
      </section>

      <section className="mt-5 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-[#36d37e]" size={18} aria-hidden="true" />
          <p className="text-xs leading-5 text-[#9db4a5]">
            收藏和开赛提醒已接入真实写入；关注球队暂时来自初始化数据，后续可继续开放操作入口。
          </p>
        </div>
      </section>

      <div className="mt-5">
        <LogoutButton />
      </div>
    </AppShell>
  );
}
