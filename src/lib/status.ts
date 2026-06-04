export const riskText = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
} as const;

export const riskClass = {
  LOW: "border-emerald-400/40 bg-emerald-400/12 text-emerald-200",
  MEDIUM: "border-amber-300/45 bg-amber-300/12 text-amber-100",
  HIGH: "border-rose-300/45 bg-rose-300/12 text-rose-100",
} as const;

export const matchStatusText = {
  SCHEDULED: "未开赛",
  LIVE: "进行中",
  FINISHED: "已结束",
  CANCELLED: "已取消",
} as const;

export const disclaimer =
  "本产品明确禁止赌博、跟单、代购和任何形式的投注行为；内容仅供娱乐和数据分析参考，不构成投注建议，不承诺任何收益。";
