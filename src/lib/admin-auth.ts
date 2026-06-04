import { redirect } from "next/navigation";
import { getCurrentUser, type AppUserRole } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";

export async function requireAdminRole(requiredRole: AppUserRole = "ANALYST") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?redirect=/admin`);
  }

  if (!hasRole(user.role, requiredRole)) {
    redirect("/403");
  }

  return user;
}
