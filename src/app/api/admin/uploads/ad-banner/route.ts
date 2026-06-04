import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/response";

export const runtime = "nodejs";

const maxUploadBytes = 4 * 1024 * 1024;
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/svg+xml", "svg"],
]);

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(fail("UNAUTHORIZED", "登录已失效，请重新登录"), { status: 401 });
  }

  if (!hasRole(user.role, "ADMIN")) {
    return NextResponse.json(fail("FORBIDDEN", "当前账号无权上传广告素材"), { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(fail("VALIDATION_ERROR", "请选择 Banner 图片"), { status: 422 });
  }

  const ext = allowedTypes.get(file.type);
  if (!ext) {
    return NextResponse.json(fail("VALIDATION_ERROR", "只支持 JPG、PNG、WebP 或 SVG 图片"), { status: 422 });
  }

  if (file.size <= 0 || file.size > maxUploadBytes) {
    return NextResponse.json(fail("VALIDATION_ERROR", "图片大小不能超过 4MB"), { status: 422 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads", "ads");
  const fileName = `banner-${Date.now()}-${randomUUID()}.${ext}`;
  const filePath = path.join(uploadDir, fileName);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, bytes);

  return NextResponse.json(
    ok({
      url: `/uploads/ads/${fileName}`,
      size: file.size,
      type: file.type,
    }),
    { status: 201 },
  );
}
