import { z } from "zod";

export const adCampaignWriteSchema = z.object({
  accountId: z.string().min(1, "请选择广告主"),
  slotId: z.string().min(1, "请选择广告位"),
  title: z.string().trim().min(2, "请填写计划标题"),
  description: z.string().trim().optional(),
  targetUrl: z.string().trim().url("请输入正确链接").optional().or(z.literal("")),
  priority: z.number().int().min(0).max(100),
  status: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED", "PAUSED"]),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  creativeTitle: z.string().trim().min(2, "请填写素材标题"),
  creativeBody: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
});

export function toAdCampaignWriteInput(data: z.infer<typeof adCampaignWriteSchema>) {
  return {
    ...data,
    description: data.description || undefined,
    targetUrl: data.targetUrl || undefined,
    creativeBody: data.creativeBody || undefined,
    imageUrl: data.imageUrl || undefined,
  };
}
