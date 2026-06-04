import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTable } from "@/components/admin/admin-table";
import { StatusTag } from "@/components/admin/status-tag";
import { requireAdminRole } from "@/lib/admin-auth";
import { getAdminPredictions, getAdminStats } from "@/services/admin-data";

export default async function AdminPage() {
  const user = await requireAdminRole("ADMIN");
  const [stats, predictions] = await Promise.all([getAdminStats(), getAdminPredictions()]);

  return (
    <AdminShell title="运营概览" description="查看今日赛事、预测审核、用户和广告数据。" user={user}>
      <div className="grid gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <AdminCard key={stat.label}>
            <p className="text-sm text-[#9db4a5]">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-[#eef7ef]">{stat.value}</p>
            <p className="mt-1 text-xs text-[#9db4a5]">{stat.hint}</p>
          </AdminCard>
        ))}
      </div>

      <div className="mt-4">
        <AdminCard title="待处理预测">
          <AdminTable
            headers={["比赛", "状态", "风险", "作者", "更新时间", "操作"]}
            rows={predictions.map((item) => [
              item.matchTitle,
              <StatusTag key="status" tone={item.status === "PUBLISHED" ? "green" : "amber"}>
                {item.status}
              </StatusTag>,
              item.riskLevel,
              item.author,
              item.updatedAt,
              <button key="action" className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#f6c85f]">
                查看
              </button>,
            ])}
          />
        </AdminCard>
      </div>
    </AdminShell>
  );
}
