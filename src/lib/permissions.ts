import type { AppUserRole } from "@/lib/auth";

const roleRank: Record<AppUserRole, number> = {
  USER: 1,
  ADVERTISER: 2,
  ANALYST: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

export function hasRole(userRole: AppUserRole, requiredRole: AppUserRole) {
  return roleRank[userRole] >= roleRank[requiredRole];
}

export function canAccessAdmin(userRole: AppUserRole) {
  return hasRole(userRole, "ANALYST");
}
