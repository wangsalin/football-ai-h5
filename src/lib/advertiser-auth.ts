import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";

export async function requireAdvertiserAccess() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/advertiser");
  }

  if (user.role !== "ADVERTISER" && !hasRole(user.role, "ADMIN")) {
    redirect("/403");
  }

  return user;
}
