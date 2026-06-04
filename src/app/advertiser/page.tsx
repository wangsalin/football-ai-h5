import { BarChart3, FileImage, MousePointerClick, UserRound } from "lucide-react";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminTable } from "@/components/admin/admin-table";
import { StatusTag } from "@/components/admin/status-tag";
import { getCtr } from "@/lib/admin-mock";
import { requireAdvertiserAccess } from "@/lib/advertiser-auth";
import { getAdvertiserDashboardData } from "@/services/ad-data";

export default async function AdvertiserPage() {
  const user = await requireAdvertiserAccess();
  const dashboard = await getAdvertiserDashboardData(user);
  const { campaigns, totalImpressions, totalClicks, totalLeads, leads } = dashboard;

  return (
    <div className="min-h-dvh bg-[#06100c] text-[#eef7ef]">
      <main className="mx-auto min-h-dvh w-full max-w-6xl px-4 py-4 md:px-6">
        <header className="rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#f6c85f]">广告主后台</p>
              <h1 className="mt-2 text-2xl font-bold text-[#eef7ef]">投放数据</h1>
              <p className="mt-2 text-sm leading-6 text-[#9db4a5]">
                查看广告计划、曝光、点击、点击率和合作线索。
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#07110d] px-3 py-2">
              <UserRound className="text-[#f6c85f]" size={18} aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[#eef7ef]">{user.nickname}</p>
                <p className="text-xs text-[#9db4a5]">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ["总曝光", `${totalImpressions}`, "当前 mock 统计"],
            ["总点击", `${totalClicks}`, "点击事件已预留接口"],
            ["点击率", getCtr(totalClicks, totalImpressions), "点击 / 曝光"],
            ["线索数", `${totalLeads}`, "表单和广告来源"],
          ].map(([label, value, hint]) => (
            <AdminCard key={label}>
              <p className="text-sm text-[#9db4a5]">{label}</p>
              <p className="mt-2 text-3xl font-bold text-[#eef7ef]">{value}</p>
              <p className="mt-1 text-xs text-[#9db4a5]">{hint}</p>
            </AdminCard>
          ))}
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <AdminCard title="广告计划">
            <AdminTable
              headers={["计划", "广告位", "状态", "投放时间", "曝光", "点击", "点击率"]}
              rows={campaigns.map((item) => [
                item.title,
                item.slot,
                <StatusTag key="status" tone={item.status === "APPROVED" ? "green" : "amber"}>
                  {item.status}
                </StatusTag>,
                `${item.startAt} 至 ${item.endAt}`,
                `${item.impressions}`,
                `${item.clicks}`,
                getCtr(item.clicks, item.impressions),
              ])}
            />
          </AdminCard>

          <AdminCard title="素材状态">
            <div className="space-y-3 text-sm">
              {campaigns.map((item) => (
                <div key={item.id} className="rounded-xl bg-[#132d21] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[#eef7ef]">{item.title}</span>
                    <FileImage size={17} className="text-[#f6c85f]" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#9db4a5]">
                    素材需管理员审核后展示，所有广告位都必须保留“广告”标识。
                  </p>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <AdminCard title="线索列表">
            <AdminTable
              headers={["品牌", "联系人", "手机号", "城市", "来源", "时间"]}
              rows={leads.map((lead) => [
                lead.companyName,
                lead.contactName,
                lead.phone,
                lead.city,
                lead.source,
                lead.createdAt,
              ])}
            />
          </AdminCard>

          <AdminCard title="事件接口">
            <div className="space-y-3 text-sm text-[#c7d7ca]">
              <p className="rounded-xl bg-[#132d21] px-3 py-3">
                <BarChart3 className="mr-2 inline text-[#36d37e]" size={16} aria-hidden="true" />
                `/api/ads/active` 返回当前广告。
              </p>
              <p className="rounded-xl bg-[#132d21] px-3 py-3">
                <MousePointerClick className="mr-2 inline text-[#f6c85f]" size={16} aria-hidden="true" />
                `/api/ads/events` 接收曝光和点击。
              </p>
            </div>
          </AdminCard>
        </div>
      </main>
    </div>
  );
}
