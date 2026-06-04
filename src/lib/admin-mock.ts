import { matches, reviews } from "@/lib/mock-data";
import { mockUsers } from "@/lib/auth";

export const adminStats = [
  { label: "今日比赛", value: "5", hint: "3 场已发布预测" },
  { label: "待审核预测", value: "2", hint: "分析师草稿待处理" },
  { label: "用户数", value: "5", hint: "含广告主和分析师" },
  { label: "今日曝光", value: "156", hint: "点击 18 次" },
];

export const adminUsers = mockUsers.map((user, index) => ({
  ...user,
  status: "ACTIVE",
  favorites: index === 0 ? 1 : 0,
  lastLoginAt: index === 0 ? "2026-05-29 20:30" : "2026-05-29 19:10",
}));

export const adminMatches = matches.map((match, index) => ({
  ...match,
  source: index < 3 ? "mockProvider" : "manual",
}));

export const adminPredictions = matches.slice(0, 4).map((match, index) => ({
  id: `p_${String(index + 1).padStart(3, "0")}`,
  match,
  status: index < 2 ? "PUBLISHED" : index === 2 ? "PENDING_REVIEW" : "DRAFT",
  author: index < 2 ? "管理员" : "分析师",
  updatedAt: "2026-05-29 20:00",
}));

export const adminReviews = reviews.map((review, index) => ({
  ...review,
  status: index < 2 ? "PUBLISHED" : "DRAFT",
  updatedAt: "2026-05-29 18:20",
}));

export const adminAds = [
  {
    id: "camp_001",
    accountId: "u_002",
    account: "城南精酿",
    slotCode: "HOME_TOP",
    slot: "首页轮播 Banner",
    title: "观赛夜套餐",
    status: "APPROVED",
    startAt: "2026-05-20",
    endAt: "2026-06-20",
    impressions: 86,
    clicks: 12,
    leads: 3,
  },
  {
    id: "camp_002",
    accountId: "u_002",
    account: "城南精酿",
    slotCode: "MATCH_DETAIL_STICKY",
    slot: "详情页贴片",
    title: "深夜看球外送",
    status: "PENDING_REVIEW",
    startAt: "2026-05-25",
    endAt: "2026-06-10",
    impressions: 48,
    clicks: 5,
    leads: 1,
  },
  {
    id: "camp_003",
    accountId: "u_004",
    account: "绿茵球馆",
    slotCode: "REVIEW_TOP",
    slot: "复盘页顶部",
    title: "周末包场",
    status: "APPROVED",
    startAt: "2026-05-18",
    endAt: "2026-06-18",
    impressions: 22,
    clicks: 1,
    leads: 0,
  },
];

export const advertiserLeads = [
  {
    id: "lead_001",
    companyName: "新天地酒吧",
    contactName: "王先生",
    phone: "136****0000",
    city: "上海",
    source: "广告合作页",
    createdAt: "2026-05-29 18:30",
  },
  {
    id: "lead_002",
    companyName: "城南精酿",
    contactName: "李女士",
    phone: "139****0002",
    city: "上海",
    source: "详情页广告",
    createdAt: "2026-05-29 19:10",
  },
];

export function getAdvertiserCampaigns(userId: string, phone?: string) {
  const mockUser = phone ? mockUsers.find((user) => user.phone === phone) : null;
  const accountId = mockUser?.id ?? userId;

  return adminAds.filter((campaign) => campaign.accountId === accountId);
}

export function getCtr(clicks: number, impressions: number) {
  if (impressions === 0) {
    return "0.00%";
  }

  return `${((clicks / impressions) * 100).toFixed(2)}%`;
}
