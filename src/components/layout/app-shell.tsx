import type { ReactNode } from "react";
import { BottomTabs } from "@/components/layout/bottom-tabs";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-[#030806] text-[#eef7ef]">
      <main className="mx-auto min-h-dvh w-full max-w-[430px] bg-[#07110d] px-4 pb-28 pt-5">
        {children}
      </main>
      <BottomTabs />
    </div>
  );
}
