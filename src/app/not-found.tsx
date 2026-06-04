import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

export default function NotFound() {
  return (
    <AppShell>
      <section className="flex min-h-[60dvh] flex-col justify-center">
        <p className="text-sm font-medium text-[#9db4a5]">404</p>
        <h1 className="mt-2 text-2xl font-bold text-[#eef7ef]">页面不存在</h1>
        <p className="mt-3 text-sm leading-6 text-[#9db4a5]">
          你访问的内容可能已下架或地址有误，可以回到首页继续查看今日赛事。
        </p>
        <Link
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#36d37e] text-sm font-semibold text-[#07110d]"
          href="/"
        >
          回到首页
        </Link>
      </section>
    </AppShell>
  );
}
