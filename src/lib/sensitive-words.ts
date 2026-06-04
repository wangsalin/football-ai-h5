export const sensitiveWords = [
  "必中",
  "稳赚",
  "包红",
  "稳红",
  "回血",
  "回本",
  "带单",
  "跟单",
  "倍投",
  "梭哈",
  "上车",
  "收米",
  "躺赚",
  "套利",
  "保证命中",
  "稳赚不赔",
  "包赔",
  "返佣",
  "博彩",
  "投注平台",
  "开户链接",
];

export function findSensitiveWords(input: string) {
  return sensitiveWords.filter((word) => input.includes(word));
}
