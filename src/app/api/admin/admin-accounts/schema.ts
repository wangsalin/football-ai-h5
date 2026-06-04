import { z } from "zod";

export const adminAccountWriteSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]{3,32}$/, "账号只能使用 3-32 位小写字母、数字、横线或下划线"),
  nickname: z.string().trim().min(1, "请填写显示名称").max(40, "显示名称不能超过 40 个字符"),
  phone: z
    .string()
    .trim()
    .regex(/^1[3-9]\d{9}$/, "手机号格式不正确")
    .optional()
    .or(z.literal("")),
  password: z.string().min(8, "密码至少 8 位").max(128, "密码不能超过 128 位").optional().or(z.literal("")),
  role: z.enum(["ANALYST", "ADMIN", "SUPER_ADMIN"]),
  status: z.enum(["ACTIVE", "DISABLED"]),
});

export const adminAccountCreateSchema = adminAccountWriteSchema.extend({
  password: z.string().min(8, "密码至少 8 位").max(128, "密码不能超过 128 位"),
});
