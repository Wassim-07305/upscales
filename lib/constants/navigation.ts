import {
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  Sparkles,
  CalendarDays,
  Award,
  User,
  Users,
  FileText,
  CalendarCheck,
  Brain,
} from "lucide-react";

import type { NavItem, NavSection } from "@/lib/types/appshell";

// ─── Constantes de roles ────────────────────────────────────

export const ALL_ROLES = ["admin", "moderator", "member", "prospect"];
export const MEMBERS_UP = ["admin", "moderator", "member"];
export const ADMIN_ROLES = ["admin", "moderator"];

// ─── Navigation eleve ──────────────────────────────────────

export const STUDENT_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
  {
    label: "Formations",
    href: "/formations",
    icon: BookOpen,
    roles: ALL_ROLES,
  },
  {
    label: "Calendrier",
    href: "/calendar",
    icon: CalendarDays,
    roles: ALL_ROLES,
  },
  {
    label: "Certificats",
    href: "/certificates",
    icon: Award,
    roles: ALL_ROLES,
  },
  {
    label: "Chat",
    href: "/chat",
    icon: MessageCircle,
    roles: MEMBERS_UP,
  },
  {
    label: "MateuzsIA",
    href: "/ai",
    icon: Sparkles,
    roles: MEMBERS_UP,
  },
];

// ─── Navigation admin ───────────────────────────────────────

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ADMIN_ROLES,
  },
  {
    label: "CRM",
    href: "/admin/crm",
    icon: Users,
    roles: ADMIN_ROLES,
  },
  {
    label: "Formations",
    href: "/admin/formations",
    icon: BookOpen,
    roles: ADMIN_ROLES,
  },
  {
    label: "Pages",
    href: "/admin/pages",
    icon: FileText,
    roles: ADMIN_ROLES,
  },
  {
    label: "Chat",
    href: "/chat",
    icon: MessageCircle,
    roles: ADMIN_ROLES,
  },
  {
    label: "MateuzsIA",
    href: "/ai",
    icon: Sparkles,
    roles: ADMIN_ROLES,
  },
  {
    label: "Base IA",
    href: "/admin/ai",
    icon: Brain,
    roles: ADMIN_ROLES,
  },
  {
    label: "Calendrier",
    href: "/admin/calendar",
    icon: CalendarDays,
    roles: ADMIN_ROLES,
  },
  {
    label: "Booking",
    href: "/admin/booking",
    icon: CalendarCheck,
    roles: ADMIN_ROLES,
  },
];

// ─── Liste plate combinee (mobile nav) ──────────────────────

export const NAV_ITEMS: NavItem[] = [...STUDENT_NAV_ITEMS, ...ADMIN_NAV_ITEMS];

// ─── Sections de navigation (sidebar grouping) ─────────────

// Sections pour les eleves
export const STUDENT_SECTIONS: NavSection[] = [
  {
    label: "",
    items: STUDENT_NAV_ITEMS.filter((i) => i.href === "/dashboard"),
  },
  {
    label: "Apprendre",
    items: STUDENT_NAV_ITEMS.filter((i) =>
      ["/formations", "/calendar", "/certificates"].includes(i.href)
    ),
  },
  {
    label: "Communication",
    items: STUDENT_NAV_ITEMS.filter((i) =>
      ["/chat", "/ai"].includes(i.href)
    ),
  },
];

// Sections pour les admins
export const ADMIN_SECTIONS: NavSection[] = [
  {
    label: "",
    items: ADMIN_NAV_ITEMS.filter((i) => i.href === "/admin"),
  },
  {
    label: "Gestion",
    items: ADMIN_NAV_ITEMS.filter((i) =>
      ["/admin/crm", "/admin/formations", "/admin/pages"].includes(i.href)
    ),
  },
  {
    label: "Communication",
    items: ADMIN_NAV_ITEMS.filter((i) =>
      ["/chat", "/ai", "/admin/ai"].includes(i.href)
    ),
  },
  {
    label: "Planning",
    items: ADMIN_NAV_ITEMS.filter((i) =>
      ["/admin/calendar", "/admin/booking"].includes(i.href)
    ),
  },
];

// ─── Labels breadcrumb ──────────────────────────────────────

export const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  formations: "Formations",
  chat: "Chat",
  calendar: "Calendrier",
  notifications: "Notifications",
  certificates: "Certificats",
  profile: "Profil",
  admin: "Administration",
  crm: "CRM",
  pages: "Pages",
  booking: "Booking",
  ai: "MateuzsIA",
  settings: "Parametres",
  edit: "Modifier",
};

// ─── Quick links (Cmd+K command palette) ────────────────────

export const QUICK_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Formations", href: "/formations", icon: BookOpen },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "MateuzsIA", href: "/ai", icon: Sparkles },
  { label: "Calendrier", href: "/calendar", icon: CalendarDays },
  { label: "Certificats", href: "/certificates", icon: Award },
  { label: "Profil", href: "/profile", icon: User },
];
