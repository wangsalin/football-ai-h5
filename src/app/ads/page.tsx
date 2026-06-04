import { Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/h5/page-header";
import { LeadForm } from "@/components/h5/lead-form";
import { AdSlot } from "@/components/ui/ad-slot";
import { adPackages } from "@/lib/mock-data";
import { createConfiguredShareMetadata } from "@/lib/share-metadata";

export async function generateMetadata() {
  return createConfiguredShareMetadata({
  title: "广告合作",
  description: "面向本地看球用户的品牌曝光与广告合作入口。",
  path: "/ads",
  });
}

export default function AdsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="广告合作"
        title="触达本地看球人群"
        description="广告只做本地消费与品牌曝光，不接受彩票、博彩、非法金融等投放。"
      />

      <section className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
          <p className="text-xs text-[#9db4a5]">核心广告位</p>
          <p className="mt-2 text-2xl font-bold text-[#f6c85f]">5 个</p>
          <p className="mt-1 text-xs leading-5 text-[#9db4a5]">首页、详情、复盘、海报</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
          <p className="text-xs text-[#9db4a5]">适合商家</p>
          <p className="mt-2 text-2xl font-bold text-[#eef7ef]">本地</p>
          <p className="mt-1 text-xs leading-5 text-[#9db4a5]">酒吧、烧烤、球馆、夜宵</p>
        </div>
      </section>

      <div className="mt-4">
        <AdSlot title="广告示例" body="所有投放内容必须显示广告标识，不能伪装成赛事分析。" />
      </div>

      <section className="mt-5">
        <h2 className="text-lg font-semibold text-[#eef7ef]">合作套餐</h2>
        <div className="mt-3 space-y-3">
          {adPackages.map((item) => (
            <article key={item.name} className="rounded-2xl border border-white/8 bg-[#11281d] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#f6c85f]">{item.name}</h3>
                  <p className="mt-1 text-xs text-[#9db4a5]">{item.fit}</p>
                </div>
                <Building2 className="text-[#36d37e]" size={19} aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm leading-6 text-[#c7d7ca]">{item.content}</p>
              <p className="mt-2 text-xs text-[#9db4a5]">{item.priceNote}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
        <h2 className="text-lg font-semibold text-[#eef7ef]">提交合作线索</h2>
        <LeadForm />
      </section>
    </AppShell>
  );
}
