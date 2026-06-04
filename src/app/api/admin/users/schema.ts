import { z } from "zod";

export const adminUserWriteSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^1[3-9]\d{9}$/)
    .optional()
    .or(z.literal("")),
  nickname: z.string().trim().max(40).optional(),
  role: z.enum(["USER", "ADVERTISER", "ANALYST", "ADMIN", "SUPER_ADMIN"]),
  status: z.enum(["ACTIVE", "DISABLED"]),
});
