import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTable } from "@/components/admin/admin-table";
import { MatchEditor } from "@/components/admin/match-editor";
import { MatchImporter } from "@/components/admin/match-importer";
import { StatusTag } from "@/components/admin/status-tag";
import { requireAdminRole } from "@/lib/admin-auth";
import { matchStatusText } from "@/lib/status";
import { getAdminMatches } from "@/services/admin-data";

export default async function AdminMatchesPage() {
  const user = await requireAdminRole("ANALYST");
  const matches = await getAdminMatches();

  return (
    <AdminShell title="赛事管理" description="维护比赛、联赛、球队、开赛时间和状态。" user={user}>
      <MatchEditor matches={matches} />
      <MatchImporter />
      <AdminCard
        title="赛事列表"
      >
        <AdminTable
          headers={["比赛", "联赛", "开赛", "状态", "来源", "操作"]}
          rows={matches.map((item) => [
            item.title,
            item.competition,
            item.kickoffAt,
            <StatusTag key="status" tone={item.status === "FINISHED" ? "gray" : "green"}>
              {matchStatusText[item.status]}
            </StatusTag>,
            item.source,
            <button key="action" className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#f6c85f]">
              编辑
            </button>,
          ])}
        />
      </AdminCard>
    </AdminShell>
  );
}
