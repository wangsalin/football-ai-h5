import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTable } from "@/components/admin/admin-table";
import { GenerateDraftButton } from "@/components/admin/generate-draft-button";
import { PredictionEditor } from "@/components/admin/prediction-editor";
import { PredictionStatusActions } from "@/components/admin/prediction-status-actions";
import { StatusTag } from "@/components/admin/status-tag";
import { requireAdminRole } from "@/lib/admin-auth";
import { getAdminMatches, getAdminPredictions } from "@/services/admin-data";

function statusTone(status: string) {
  if (status === "PUBLISHED") return "green" as const;
  if (status === "PENDING_REVIEW") return "amber" as const;
  return "gray" as const;
}

export default async function AdminPredictionsPage() {
  const user = await requireAdminRole("ANALYST");
  const [predictions, matches] = await Promise.all([getAdminPredictions(), getAdminMatches()]);

  return (
    <AdminShell title="预测管理" description="创建草稿、提交审核、发布或下架预测内容。" user={user}>
      <PredictionEditor matches={matches} predictions={predictions} />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <AdminCard
          title="预测列表"
        >
          <AdminTable
            headers={["比赛", "摘要", "风险", "状态", "作者", "操作"]}
            rows={predictions.map((item) => [
              item.matchTitle,
              <span key="summary" className="line-clamp-2 text-[#c7d7ca]">
                {item.summary}
              </span>,
              item.riskLevel,
              <StatusTag key="status" tone={statusTone(item.status)}>
                {item.status}
              </StatusTag>,
              item.author,
              <PredictionStatusActions key="actions" predictionId={item.id} status={item.status} />,
            ])}
          />
        </AdminCard>

        <div className="space-y-4">
          <AdminCard title="AI 草稿">
            <GenerateDraftButton matches={matches} />
            <p className="mt-4 text-xs leading-5 text-[#9db4a5]">
              默认使用 MOCK_LLM。生成结果只作为草稿展示，不会自动发布，也不会绕过敏感词检查。
            </p>
          </AdminCard>

          <AdminCard title="预测状态流">
            <ol className="space-y-3 text-sm">
              {["DRAFT 保存草稿", "PENDING_REVIEW 提交审核", "PUBLISHED 发布前台", "OFFLINE 下架"].map(
                (item) => (
                  <li key={item} className="rounded-xl bg-[#132d21] px-3 py-3 text-[#c7d7ca]">
                    {item}
                  </li>
                ),
              )}
            </ol>
            <p className="mt-4 text-xs leading-5 text-[#9db4a5]">
              发布前必须检查敏感词、比分建议数量、风险等级和免责声明。真实写操作会记录审计日志。
            </p>
          </AdminCard>
        </div>
      </div>
    </AdminShell>
  );
}
