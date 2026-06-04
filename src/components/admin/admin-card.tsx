import type { ReactNode } from "react";

type AdminCardProps = {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
};

export function AdminCard({ title, children, action }: AdminCardProps) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
      {title || action ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="text-lg font-semibold text-[#eef7ef]">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
