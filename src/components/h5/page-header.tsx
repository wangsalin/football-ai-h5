import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-xs font-medium text-[#9db4a5]">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-bold tracking-normal text-[#eef7ef]">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-[#9db4a5]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
