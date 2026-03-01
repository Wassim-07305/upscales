import {
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  Sparkles,
  Newspaper,
  CalendarDays,
  Bell,
  Award,
  User,
  BarChart3,
  Users,
  FileText,
  CalendarCheck,
  MessageSquare,
  Brain,
  Settings,
} from "lucide-react";

import type { NavItem, NavSection } from "@/lib/types/appshell";

// ─── Constantes de roles ────────────────────────────────────

export const ALL_ROLES = ["admin", "moderator", "member", "prospect"];
export const MEMBERS_UP = ["admin", "moderator", "member"];
export const ADMIN_ROLES = ["admin", "moderator"];

// ─── Navigation principale ─────────────────────────────────

export const MAIN_NAV_ITEMS: NavItem[] = [
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
  {
    label: "Communaute",
    href: "/community",
    icon: Newspaper,
    roles: ALL_ROLES,
  },
  {
    label: "Calendrier",
    href: "/calendar",
    icon: CalendarDays,
    roles: ALL_ROLES,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    roles: ALL_ROLES,
  },
  {
    label: "Certificats",
    href: "/certificates",
    icon: Award,
    roles: ALL_ROLES,
  },
  {
    label: "Profil",
    href: "/profile",
    icon: User,
    roles: ALL_ROLES,
  },
];

// ─── Navigation admin ───────────────────────────────────────

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    label: "Analytics",
    href: "/admin",
    icon: BarChart3,
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
    label: "Booking",
    href: "/admin/booking",
    icon: CalendarCheck,
    roles: ADMIN_ROLES,
  },
  {
    label: "Channels",
    href: "/admin/channels",
    icon: MessageSquare,
    roles: ADMIN_ROLES,
  },
  {
    label: "Sessions",
    href: "/admin/calendar",
    icon: CalendarDays,
    roles: ADMIN_ROLES,
  },
  {
    label: "Base IA",
    href: "/admin/ai",
    icon: Brain,
    roles: ADMIN_ROLES,
  },
  {
    label: "Parametres",
    href: "/admin/settings",
    icon: Settings,
    roles: ["admin"],
  },
];

// ─── Liste plate combinee (mobile nav) ──────────────────────

export const NAV_ITEMS: NavItem[] = [...MAIN_NAV_ITEMS, ...ADMIN_NAV_ITEMS];

// ─── Sections de navigation (sidebar grouping) ─────────────

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "",
    items: MAIN_NAV_ITEMS.filter((i) => i.href === "/dashboard"),
  },
  {
    label: "Apprendre",
    items: MAIN_NAV_ITEMS.filter((i) =>
      ["/formations", "/calendar", "/certificates"].includes(i.href)
    ),
  },
  {
    label: "Communaute",
    items: MAIN_NAV_ITEMS.filter((i) =>
      ["/chat", "/ai", "/community"].includes(i.href)
    ),
  },
  {
    label: "Mon espace",
    items: MAIN_NAV_ITEMS.filter((i) =>
      ["/notifications", "/profile"].includes(i.href)
    ),
  },
  {
    label: "Administration",
    items: ADMIN_NAV_ITEMS,
  },
];

// ─── Labels breadcrumb ──────────────────────────────────────

export const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  formations: "Formations",
  chat: "Chat",
  community: "Communaute",
  calendar: "Calendrier",
  notifications: "Notifications",
  certificates: "Certificats",
  profile: "Profil",
  admin: "Administration",
  crm: "CRM",
  pages: "Pages",
  booking: "Booking",
  channels: "Channels",
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
  { label: "Communaute", href: "/community", icon: Newspaper },
  { label: "Calendrier", href: "/calendar", icon: CalendarDays },
  { label: "Certificats", href: "/certificates", icon: Award },
  { label: "Profil", href: "/profile", icon: User },
];
