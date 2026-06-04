import { riskClass, riskText } from "@/lib/status";

type RiskBadgeProps = {
  level: keyof typeof riskText;
};

export function RiskBadge({ level }: RiskBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${riskClass[level]}`}
    >
      风险{riskText[level]}
    </span>
  );
}
