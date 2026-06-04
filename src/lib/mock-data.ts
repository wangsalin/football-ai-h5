export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";

export type AnalysisSection = {
  key: string;
  title: string;
  content: string;
};

export type MatchPreview = {
  id: string;
  date: string;
  competition: string;
  kickoffTime: string;
  homeTeam: string;
  awayTeam: string;
  status: MatchStatus;
  riskLevel: RiskLevel;
  confidence: number;
  summary: string;
  winDrawLossPick: string;
  handicapPick: string;
  totalGoalsPick: string;
  halfFullPick: string;
  coldAlertReason: string;
  scorePicks: string[];
  sections: AnalysisSection[];
  odds: {
    europeanInitial: string;
    europeanCurrent: string;
    asianInitial: string;
    asianCurrent: string;
    goalLineInitial: string;
    goalLineCurrent: string;
    source?: string;
    capturedAt?: string;
  };
};

export type ReviewItem = {
  id: string;
  matchId: string;
  competition: string;
  teams: string;
  predicted: string;
  actualResult: string;
  resultType: "HIT" | "MISS" | "PARTIAL";
  hitSummary: string;
  missReason?: string;
};

export type AdPackage = {
  name: string;
  fit: string;
  content: string;
  priceNote: string;
};

const defaultSections: AnalysisSection[] = [
  {
    key: "basic",
    title: "基本面",
    content: "主队近期主场稳定性更好，客队连续客场后防压迫质量有所下降，整体判断更偏主队不败。",
  },
  {
    key: "lineup",
    title: "阵容面",
    content: "双方均有个别轮换风险，但暂未出现足以改变主线判断的核心缺口，临场名单仍需确认。",
  },
  {
    key: "odds",
    title: "数据面",
    content: "初始数据支持主队方向，即时变化略有升温，说明市场热度集中后需要保留平局保护。",
  },
  {
    key: "tempo",
    title: "比赛节奏",
    content: "预计开局阶段较谨慎，中后段主队会增加边路推进，客队更依赖反击和定位球。",
  },
  {
    key: "risk",
    title: "风险提示",
    content: "主队方向热度偏高，如临场继续降赔，需要防范热门过热带来的平局风险。",
  },
];

export const matches: MatchPreview[] = [
  {
    id: "m_001",
    date: "2026-05-29",
    competition: "德甲",
    kickoffTime: "19:30",
    homeTeam: "帕德博恩",
    awayTeam: "沃尔夫斯堡",
    status: "SCHEDULED",
    riskLevel: "MEDIUM",
    confidence: 6.5,
    summary: "主队不败优先，但盘口升温后需要防平。",
    winDrawLossPick: "胜/平",
    handicapPick: "让平/让负",
    totalGoalsPick: "2/3球",
    halfFullPick: "平胜/平平",
    coldAlertReason: "主队方向升温较明显，如临场继续降主胜赔，需防热门过热导致平局。",
    scorePicks: ["1-0", "1-1", "2-1"],
    sections: defaultSections,
    odds: {
      europeanInitial: "2.10 / 3.30 / 3.20",
      europeanCurrent: "1.95 / 3.35 / 3.60",
      asianInitial: "主让0.25",
      asianCurrent: "主让0.5",
      goalLineInitial: "2.5",
      goalLineCurrent: "2.25",
    },
  },
  {
    id: "m_002",
    date: "2026-05-29",
    competition: "英超",
    kickoffTime: "22:00",
    homeTeam: "阿森纳",
    awayTeam: "埃弗顿",
    status: "SCHEDULED",
    riskLevel: "LOW",
    confidence: 7.2,
    summary: "主队基本面更完整，进攻端优势明显。",
    winDrawLossPick: "胜",
    handicapPick: "让胜/让平",
    totalGoalsPick: "2/3球",
    halfFullPick: "胜胜/平胜",
    coldAlertReason: "低风险不代表确定性，若锋线轮换幅度过大，进球效率会下降。",
    scorePicks: ["2-0", "2-1", "3-1"],
    sections: defaultSections,
    odds: {
      europeanInitial: "1.58 / 4.00 / 5.20",
      europeanCurrent: "1.50 / 4.20 / 5.80",
      asianInitial: "主让1",
      asianCurrent: "主让1.25",
      goalLineInitial: "2.75",
      goalLineCurrent: "2.75",
    },
  },
  {
    id: "m_003",
    date: "2026-05-30",
    competition: "西甲",
    kickoffTime: "02:45",
    homeTeam: "皇家社会",
    awayTeam: "瓦伦西亚",
    status: "SCHEDULED",
    riskLevel: "HIGH",
    confidence: 5.8,
    summary: "客队反击效率不低，主队方向不宜过热。",
    winDrawLossPick: "胜/平/负",
    handicapPick: "让负",
    totalGoalsPick: "1/2球",
    halfFullPick: "平平/平负",
    coldAlertReason: "双方节奏偏慢，若主队久攻不下，客队反击会放大冷门风险。",
    scorePicks: ["1-1", "2-1", "1-2"],
    sections: defaultSections,
    odds: {
      europeanInitial: "1.92 / 3.25 / 3.95",
      europeanCurrent: "1.86 / 3.20 / 4.30",
      asianInitial: "主让0.5",
      asianCurrent: "主让0.5",
      goalLineInitial: "2.25",
      goalLineCurrent: "2.0",
    },
  },
  {
    id: "m_004",
    date: "2026-05-28",
    competition: "意甲",
    kickoffTime: "21:00",
    homeTeam: "拉齐奥",
    awayTeam: "都灵",
    status: "FINISHED",
    riskLevel: "MEDIUM",
    confidence: 6.1,
    summary: "主队控球更多，但转化效率一般。",
    winDrawLossPick: "胜/平",
    handicapPick: "让负",
    totalGoalsPick: "1/2球",
    halfFullPick: "平平/平胜",
    coldAlertReason: "低比分比赛容易被定位球改变。",
    scorePicks: ["1-0", "1-1", "2-0"],
    sections: defaultSections,
    odds: {
      europeanInitial: "2.00 / 3.10 / 3.60",
      europeanCurrent: "2.05 / 3.00 / 3.55",
      asianInitial: "主让0.25",
      asianCurrent: "主让0.25",
      goalLineInitial: "2.25",
      goalLineCurrent: "2.0",
    },
  },
];

export const featuredMatches = matches.slice(0, 3);

export const dashboardStats = [
  { label: "今日重点", value: "5 场" },
  { label: "复盘命中", value: "2/3" },
  { label: "冷门预警", value: "1 场" },
];

export const reviews: ReviewItem[] = [
  {
    id: "r_001",
    matchId: "m_004",
    competition: "意甲",
    teams: "拉齐奥 vs 都灵",
    predicted: "主队不败，比分 1-0 / 1-1",
    actualResult: "1-1",
    resultType: "HIT",
    hitSummary: "低比分和防平判断符合赛前主线。",
  },
  {
    id: "r_002",
    matchId: "m_005",
    competition: "法甲",
    teams: "里昂 vs 雷恩",
    predicted: "主胜优先，防小比分",
    actualResult: "0-1",
    resultType: "MISS",
    hitSummary: "方向判断偏差，客队反击效率超出预期。",
    missReason: "战意和转换效率评估不足，后续需要提高临场阵容权重。",
  },
  {
    id: "r_003",
    matchId: "m_006",
    competition: "德甲",
    teams: "不莱梅 vs 美因茨",
    predicted: "总进球 2/3 球",
    actualResult: "2-1",
    resultType: "HIT",
    hitSummary: "节奏判断和进球区间符合实际走势。",
  },
];

export const adPackages: AdPackage[] = [
  {
    name: "基础曝光包",
    fit: "烧烤、夜宵、茶饮",
    content: "首页广告 + 复盘页露出",
    priceNote: "适合低成本试投",
  },
  {
    name: "焦点赛事包",
    fit: "酒吧、精酿、球馆",
    content: "单场详情页贴片 + 海报底部",
    priceNote: "适合重点比赛前集中曝光",
  },
  {
    name: "城市包月包",
    fit: "连锁餐饮、本地活动",
    content: "首页 + 详情 + 复盘 + 海报组合",
    priceNote: "适合长期本地品牌触达",
  },
];

export function getMatchById(id: string) {
  return matches.find((match) => match.id === id);
}
