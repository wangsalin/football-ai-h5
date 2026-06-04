import { NextResponse } from "next/server";
import { clearDbSession, sessionCookieName, sessionCookieOptions } from "@/lib/auth";
import { ok } from "@/lib/response";

export async function POST(request: Request) {
  const rawCookie = request.headers.get("cookie") ?? "";
  const rawToken = rawCookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${sessionCookieName}=`))
    ?.split("=")[1];

  await clearDbSession(rawToken);

  const response = NextResponse.json(ok({ loggedOut: true }));
  response.cookies.set(sessionCookieName, "", sessionCookieOptions(0));
  return response;
}
