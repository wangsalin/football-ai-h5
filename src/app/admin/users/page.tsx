import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTable } from "@/components/admin/admin-table";
import { RegistrationSettingsEditor } from "@/components/admin/registration-settings-editor";
import { StatusTag } from "@/components/admin/status-tag";
import { UserActions } from "@/components/admin/user-actions";
import { requireAdminRole } from "@/lib/admin-auth";
import { getAdminUsers } from "@/services/admin-data";
import { getRegistrationSettings } from "@/services/admin-settings";

export default async function AdminUsersPage() {
  const user = await requireAdminRole("ADMIN");
  const [users, registrationSettings] = await Promise.all([getAdminUsers(), getRegistrationSettings()]);

  return (
    <AdminShell title="用户管理" description="查看用户、编辑资料、调整角色、启用或禁用账号。高危操作会写入审计日志。" user={user}>
      <div className="mb-4">
        <AdminCard title="注册设置">
          <RegistrationSettingsEditor settings={registrationSettings} />
        </AdminCard>
      </div>

      <AdminCard title="用户列表">
        <AdminTable
          headers={["手机号", "昵称", "角色", "状态", "收藏", "最近登录", "操作"]}
          rows={users.map((item) => [
            item.phone,
            item.nickname,
            item.role,
            <StatusTag key="status" tone={item.status === "ACTIVE" ? "green" : "red"}>
              {item.status}
            </StatusTag>,
            `${item.favorites}`,
            item.lastLoginAt,
            <UserActions
              key="action"
              userId={item.id}
              phone={item.rawPhone}
              nickname={item.nickname}
              role={item.role}
              status={item.status}
            />,
          ])}
        />
      </AdminCard>
    </AdminShell>
  );
}
