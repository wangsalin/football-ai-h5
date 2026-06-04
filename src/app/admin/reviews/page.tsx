import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTable } from "@/components/admin/admin-table";
import { ReviewEditor } from "@/components/admin/review-editor";
import { ReviewStatusActions } from "@/components/admin/review-status-actions";
import { StatusTag } from "@/components/admin/status-tag";
import { requireAdminRole } from "@/lib/admin-auth";
import { getAdminMatches, getAdminPredictions, getAdminReviews } from "@/services/admin-data";

export default async function AdminReviewsPage() {
  const user = await requireAdminRole("ANALYST");
  const [reviews, matches, predictions] = await Promise.all([getAdminReviews(), getAdminMatches(), getAdminPredictions()]);

  return (
    <AdminShell title="复盘管理" description="已结束比赛才能发布复盘，偏差必须填写原因。" user={user}>
      <ReviewEditor matches={matches} predictions={predictions} reviews={reviews} />
      <AdminCard title="复盘列表">
        <AdminTable
          headers={["比赛", "赛果", "结果", "复盘摘要", "错因", "状态", "操作"]}
          rows={reviews.map((item) => [
            item.teams,
            item.actualResult,
            <StatusTag key="result" tone={item.resultType === "HIT" ? "green" : "red"}>
              {item.resultType}
            </StatusTag>,
            item.hitSummary,
            item.missReason || "无",
            <StatusTag key="status" tone={item.status === "PUBLISHED" ? "green" : "gray"}>
              {item.status}
            </StatusTag>,
            <ReviewStatusActions key="actions" reviewId={item.id} status={item.status} />,
          ])}
        />
      </AdminCard>
    </AdminShell>
  );
}
