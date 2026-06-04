import { NextResponse } from "next/server";
import { authorizeJobRequest } from "@/lib/job-auth";
import { fail, ok } from "@/lib/response";
import { runAutoReviews } from "@/services/auto-ai-jobs";

export async function POST(request: Request) {
  const auth = await authorizeJobRequest(request, "ANALYST");

  if (!auth.ok) {
    return NextResponse.json(fail(auth.code, auth.message), { status: auth.status });
  }

  return NextResponse.json(ok({ result: await runAutoReviews(auth.user), auth: auth.via }));
}
