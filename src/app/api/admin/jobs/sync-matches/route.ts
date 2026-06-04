import { NextResponse } from "next/server";
import { authorizeJobRequest } from "@/lib/job-auth";
import { fail, ok } from "@/lib/response";
import { runMatchSourceSync } from "@/services/match-source-sync";

export async function POST(request: Request) {
  const auth = await authorizeJobRequest(request, "ANALYST");

  if (!auth.ok) {
    return NextResponse.json(fail(auth.code, auth.message), { status: auth.status });
  }

  try {
    return NextResponse.json(ok({ result: await runMatchSourceSync(auth.user), auth: auth.via }));
  } catch (error) {
    console.error("Match source sync failed", error);
    return NextResponse.json(fail("SYNC_FAILED", "赛事同步失败，请检查数据源配置"), { status: 409 });
  }
}
