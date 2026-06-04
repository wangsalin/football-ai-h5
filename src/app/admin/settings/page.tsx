import { AdminAccountsEditor } from "@/components/admin/admin-accounts-editor";
import { AdminShell } from "@/components/admin/admin-shell";
import { AutomationSettingsEditor } from "@/components/admin/automation-settings-editor";
import { IntegrationSettingsEditor } from "@/components/admin/integration-settings-editor";
import { SiteSettingsEditor } from "@/components/admin/site-settings-editor";
import { SystemSettingsEditor } from "@/components/admin/system-settings-editor";
import { requireAdminRole } from "@/lib/admin-auth";
import { getAdminAccounts } from "@/services/admin-data";
import {
  getAiSettingsForAdmin,
  getAutomationSettings,
  getMatchSourceSettings,
  getSiteSettings,
  getSmsSettingsForAdmin,
  getWechatSettingsForAdmin,
} from "@/services/admin-settings";

export default async function AdminSettingsPage() {
  const user = await requireAdminRole("ADMIN");
  const [aiSettings, matchSourceSettings, automationSettings, siteSettings, adminAccounts, smsSettings, wechatSettings] =
    await Promise.all([
    getAiSettingsForAdmin(),
    getMatchSourceSettings(),
    getAutomationSettings(),
    getSiteSettings(),
    getAdminAccounts(),
    getSmsSettingsForAdmin(),
    getWechatSettingsForAdmin(),
  ]);

  return (
    <AdminShell
      title="系统设置"
      description="配置 AI 模型、Prompt、赛事数据源和同步策略。配置变更会写入审计日志。"
      user={user}
    >
      <div className="mb-4 grid gap-4">
        <SiteSettingsEditor settings={siteSettings} />
        <AdminAccountsEditor accounts={adminAccounts} />
      </div>
      <SystemSettingsEditor aiSettings={aiSettings} matchSourceSettings={matchSourceSettings} />
      <IntegrationSettingsEditor smsSettings={smsSettings} wechatSettings={wechatSettings} />
      <AutomationSettingsEditor settings={automationSettings} />
    </AdminShell>
  );
}
