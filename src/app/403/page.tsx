import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

export default function ForbiddenPage() {
  return (
    <AppShell>
      <section className="flex min-h-[60dvh] flex-col justify-center">
        <p className="text-sm font-medium text-[#9db4a5]">403</p>
        <h1 className="mt-2 text-2xl font-bold text-[#eef7ef]">没有访问权限</h1>
        <p className="mt-3 text-sm leading-6 text-[#9db4a5]">
          当前账号不能访问该后台功能。如需处理赛事、预测或广告，请切换到管理员或分析师账号。
        </p>
        <Link
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#36d37e] text-sm font-semibold text-[#07110d]"
          href="/login?redirect=/admin"
        >
          切换账号
        </Link>
      </section>
    </AppShell>
  );
}
