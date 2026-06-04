import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTable } from "@/components/admin/admin-table";
import { AdCampaignEditor } from "@/components/admin/ad-campaign-editor";
import { AdStatusActions } from "@/components/admin/ad-status-actions";
import { StatusTag } from "@/components/admin/status-tag";
import { requireAdminRole } from "@/lib/admin-auth";
import { getAdminAdOptions, getAdminAds } from "@/services/admin-data";

export default async function AdminAdsPage() {
  const user = await requireAdminRole("ADMIN");
  const [ads, options] = await Promise.all([getAdminAds(), getAdminAdOptions()]);

  return (
    <AdminShell title="广告管理" description="管理广告主、广告位、素材审核、投放时间和曝光点击。" user={user}>
      <AdCampaignEditor accounts={options.accounts} slots={options.slots} campaigns={ads} />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <AdminCard title="广告计划">
          <AdminTable
            headers={["广告主", "广告位", "标题", "状态", "曝光", "点击", "操作"]}
            rows={ads.map((item) => [
              item.account,
              item.slot,
              item.title,
              <StatusTag key="status" tone={item.status === "APPROVED" ? "green" : "amber"}>
                {item.status}
              </StatusTag>,
              `${item.impressions}`,
              `${item.clicks}`,
              <AdStatusActions key="actions" campaignId={item.id} />,
            ])}
          />
        </AdminCard>

        <AdminCard title="审核底线">
          <div className="space-y-3 text-sm text-[#c7d7ca]">
            <p className="rounded-xl bg-[#132d21] px-3 py-3">所有广告必须显示“广告”标识。</p>
            <p className="rounded-xl bg-[#132d21] px-3 py-3">禁止博彩、彩票代购、非法金融和虚假收益承诺。</p>
            <p className="rounded-xl bg-[#132d21] px-3 py-3">拒绝素材必须填写可读原因。</p>
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
