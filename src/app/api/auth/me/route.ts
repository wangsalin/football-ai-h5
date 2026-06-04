import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ok } from "@/lib/response";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(ok({ user }));
}
