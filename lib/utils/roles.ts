import { UserRole } from "@/lib/types/database";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  prospect: 0,
  member: 1,
  moderator: 2,
  admin: 3,
};

export function hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function isModerator(role: UserRole): boolean {
  return role === "admin" || role === "moderator";
}

export function isMember(role: UserRole): boolean {
  return hasMinRole(role, "member");
}

export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case "admin":
      return "bg-neon/20 text-neon border-neon/30";
    case "moderator":
      return "bg-turquoise/20 text-turquoise border-turquoise/30";
    case "member":
      return "bg-neon/10 text-neon border-neon/20";
    case "prospect":
      return "bg-[#222222] text-[#999999] border-[#2A2A2A]";
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "moderator":
      return "Modérateur";
    case "member":
      return "Membre";
    case "prospect":
      return "Prospect";
  }
}
