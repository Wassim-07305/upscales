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
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "moderator":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "member":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "prospect":
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
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
