// ─── lib/permissions.ts ─────────────────────────────────────────────────────
// Manifest des permissions pour F3.2 — Rôle Modérateur.
// Re-exporte les helpers depuis lib/utils/roles pour un import unique.

export { isAdmin, isModerator, hasMinRole, isMember } from "@/lib/utils/roles";

// Routes accessibles aux modérateurs (et admins) dans la section /admin.
// /admin/settings, /admin/ai et /admin/audit sont intentionnellement absents.
export const MODERATOR_ALLOWED_ROUTES: readonly string[] = [
  "/admin",
  "/admin/analytics",
  "/admin/crm",
  "/admin/formations",
  "/admin/pages",
  "/admin/calendar",
  "/admin/booking",
  "/admin/broadcast",
  "/admin/channels",
  "/admin/moderation",
  "/chat",
  "/community",
  "/ai",
] as const;
