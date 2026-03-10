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
  Globe,
  Settings,
  Bell,
  BarChart3,
  Trophy,
  Gift,
  TrendingUp,
  Shield,
  Hash,
  Megaphone,
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
    label: "Classement",
    href: "/leaderboard",
    icon: Trophy,
    roles: ALL_ROLES,
  },
  {
    label: "Ma progression",
    href: "/progress",
    icon: TrendingUp,
    roles: ALL_ROLES,
  },
  {
    label: "Chat",
    href: "/chat",
    icon: MessageCircle,
    roles: MEMBERS_UP,
  },
  {
    label: "Communauté",
    href: "/community",
    icon: Globe,
    roles: MEMBERS_UP,
  },
  {
    label: "MateuzsIA",
    href: "/ai",
    icon: Sparkles,
    roles: MEMBERS_UP,
  },
  {
    label: "Parrainage",
    href: "/referral",
    icon: Gift,
    roles: ALL_ROLES,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    roles: ALL_ROLES,
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
    label: "Analytics",
    href: "/admin/analytics",
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
  {
    label: "Communauté",
    href: "/community",
    icon: Globe,
    roles: ADMIN_ROLES,
  },
  {
    label: "Annonces",
    href: "/admin/broadcast",
    icon: Megaphone,
    roles: ADMIN_ROLES,
  },
  {
    label: "Channels",
    href: "/admin/channels",
    icon: Hash,
    roles: ADMIN_ROLES,
  },
  {
    label: "Modération",
    href: "/admin/moderation",
    icon: Shield,
    roles: ADMIN_ROLES,
  },
  {
    label: "Paramètres",
    href: "/admin/settings",
    icon: Settings,
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
      ["/formations", "/calendar", "/certificates", "/leaderboard", "/progress"].includes(i.href)
    ),
  },
  {
    label: "Social",
    items: STUDENT_NAV_ITEMS.filter((i) =>
      ["/chat", "/community", "/ai"].includes(i.href)
    ),
  },
  {
    label: "",
    items: STUDENT_NAV_ITEMS.filter((i) =>
      ["/referral", "/notifications"].includes(i.href)
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
      ["/admin/crm", "/admin/formations", "/admin/pages", "/admin/analytics"].includes(i.href)
    ),
  },
  {
    label: "Communication",
    items: ADMIN_NAV_ITEMS.filter((i) =>
      ["/chat", "/community", "/ai", "/admin/ai", "/admin/broadcast", "/admin/channels", "/admin/moderation"].includes(i.href)
    ),
  },
  {
    label: "Planning",
    items: ADMIN_NAV_ITEMS.filter((i) =>
      ["/admin/calendar", "/admin/booking"].includes(i.href)
    ),
  },
  {
    label: "",
    items: ADMIN_NAV_ITEMS.filter((i) =>
      ["/admin/settings"].includes(i.href)
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
  leaderboard: "Classement",
  progress: "Ma progression",
  referral: "Parrainage",
  profile: "Profil",
  admin: "Administration",
  crm: "CRM",
  pages: "Pages",
  booking: "Booking",
  ai: "MateuzsIA",
  analytics: "Analytics",
  members: "Membres",
  broadcast: "Annonces",
  channels: "Channels",
  moderation: "Modération",
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
  { label: "Classement", href: "/leaderboard", icon: Trophy },
  { label: "Ma progression", href: "/progress", icon: TrendingUp },
  { label: "Profil", href: "/profile", icon: User },
];
