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
  BarChart3,
  Trophy,
  Gift,
  TrendingUp,
  Shield,
  Hash,
  Megaphone,
  StickyNote,
  Bug,
  Target,
  ListTodo,
  FolderOpen,
  ClipboardList,
  Clapperboard,
  UsersRound,
  Link2,
  ClipboardCheck,
} from "lucide-react";

import type { NavItem, NavSection } from "@/lib/types/appshell";

// ─── Constantes de roles ────────────────────────────────────

export const ALL_ROLES = ["admin", "moderator", "member", "prospect"];
export const MEMBERS_UP = ["admin", "moderator", "member"];
export const ADMIN_ROLES = ["admin", "moderator"];
export const ADMIN_ONLY_ROLES: string[] = ["admin"];

// ─── Navigation eleve ──────────────────────────────────────

export const STUDENT_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
  {
    label: "Mes tâches",
    href: "/tasks",
    icon: ListTodo,
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
    label: "Mes notes",
    href: "/notes",
    icon: StickyNote,
    roles: ALL_ROLES,
  },
  {
    label: "Playbooks",
    href: "/playbook",
    icon: ClipboardList,
    roles: MEMBERS_UP,
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
    label: "Mes Prospects",
    href: "/prospects",
    icon: Target,
    roles: MEMBERS_UP,
  },
  {
    label: "Mes Pages",
    href: "/my-pages",
    icon: FileText,
    roles: MEMBERS_UP,
  },
  {
    label: "Mes Réservations",
    href: "/my-booking",
    icon: CalendarCheck,
    roles: MEMBERS_UP,
  },
  {
    label: "Ressources",
    href: "/ressources",
    icon: FolderOpen,
    roles: MEMBERS_UP,
  },
  {
    label: "Liens & Outils",
    href: "/tools",
    icon: Link2,
    roles: MEMBERS_UP,
  },
  {
    label: "Parrainage",
    href: "/referral",
    icon: Gift,
    roles: ALL_ROLES,
  },
  {
    label: "Paramètres",
    href: "/settings",
    icon: Settings,
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
    label: "Mes tâches",
    href: "/tasks",
    icon: ListTodo,
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
    roles: ADMIN_ONLY_ROLES,
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
    label: "Équipe",
    href: "/admin/team",
    icon: UsersRound,
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
    label: "Contenu",
    href: "/admin/content",
    icon: Clapperboard,
    roles: ADMIN_ROLES,
  },
  {
    label: "Exercices",
    href: "/admin/exercises",
    icon: FileText,
    roles: ADMIN_ROLES,
  },
  {
    label: "Playbooks",
    href: "/admin/playbooks",
    icon: ClipboardList,
    roles: ADMIN_ROLES,
  },
  {
    label: "OKRs",
    href: "/admin/okrs",
    icon: Target,
    roles: ADMIN_ROLES,
  },
  {
    label: "SOPs",
    href: "/admin/sops",
    icon: FolderOpen,
    roles: ADMIN_ONLY_ROLES,
  },
  {
    label: "Liens & Outils",
    href: "/admin/tools",
    icon: Link2,
    roles: ADMIN_ONLY_ROLES,
  },
  {
    label: "Audit",
    href: "/admin/audit",
    icon: ClipboardCheck,
    roles: ADMIN_ONLY_ROLES,
  },
  {
    label: "Error Logs",
    href: "/admin/error-logs",
    icon: Bug,
    roles: ADMIN_ONLY_ROLES,
  },
  {
    label: "Ressources",
    href: "/ressources",
    icon: FolderOpen,
    roles: ADMIN_ROLES,
  },
  {
    label: "Utilisateurs",
    href: "/admin/users",
    icon: UsersRound,
    roles: ADMIN_ROLES,
  },
  {
    label: "Mon profil",
    href: "/profile",
    icon: User,
    roles: ADMIN_ROLES,
  },
  {
    label: "Paramètres",
    href: "/admin/settings",
    icon: Settings,
    roles: ADMIN_ONLY_ROLES,
  },
];

// Sections pour les modérateurs — même structure minimaliste
export const MODERATOR_ADMIN_SECTIONS: NavSection[] = [
  {
    label: "",
    items: ADMIN_NAV_ITEMS.filter((i) =>
      ["/admin", "/admin/crm", "/admin/formations", "/ressources", "/admin/users"].includes(i.href)
    ),
  },
  {
    label: "",
    items: ADMIN_NAV_ITEMS.filter((i) =>
      ["/chat", "/community", "/ai"].includes(i.href)
    ),
  },
  {
    label: "",
    items: ADMIN_NAV_ITEMS.filter((i) =>
      ["/tasks", "/admin/calendar"].includes(i.href)
    ),
  },
];

// ─── Liste plate combinee (mobile nav) ──────────────────────

export const NAV_ITEMS: NavItem[] = [...STUDENT_NAV_ITEMS, ...ADMIN_NAV_ITEMS];

// ─── Sections de navigation (sidebar grouping) ─────────────

// Sections pour les eleves — sidebar minimale
export const STUDENT_SECTIONS: NavSection[] = [
  {
    label: "",
    items: STUDENT_NAV_ITEMS.filter((i) =>
      ["/dashboard", "/formations", "/tasks", "/calendar"].includes(i.href)
    ),
  },
  {
    label: "",
    items: STUDENT_NAV_ITEMS.filter((i) =>
      ["/chat", "/community", "/ai"].includes(i.href)
    ),
  },
  {
    label: "",
    items: STUDENT_NAV_ITEMS.filter((i) =>
      ["/prospects", "/my-pages", "/my-booking", "/ressources"].includes(i.href)
    ),
  },
  {
    label: "",
    items: STUDENT_NAV_ITEMS.filter((i) =>
      ["/settings"].includes(i.href)
    ),
  },
];

// Sections pour les admins — sidebar minimale, sous-pages accessibles via SubNav
export const ADMIN_SECTIONS: NavSection[] = [
  {
    label: "",
    items: ADMIN_NAV_ITEMS.filter((i) =>
      ["/admin", "/admin/crm", "/admin/formations", "/ressources", "/admin/tools", "/admin/users"].includes(i.href)
    ),
  },
  {
    label: "",
    items: ADMIN_NAV_ITEMS.filter((i) =>
      ["/chat", "/community", "/ai"].includes(i.href)
    ),
  },
  {
    label: "",
    items: ADMIN_NAV_ITEMS.filter((i) =>
      ["/tasks", "/admin/calendar"].includes(i.href)
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
  notes: "Mes notes",
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
  exercises: "Exercices",
  okrs: "OKRs",
  tasks: "Mes tâches",
  sops: "SOPs",
  audit: "Audit",
  playbook: "Playbooks",
  playbooks: "Playbooks",
  leads: "Pipeline",
  content: "Contenu",
  team: "Équipe",
  prospects: "Mes Prospects",
  tools: "Liens & Outils",
  ressources: "Ressources",
  "error-logs": "Error Logs",
  users: "Utilisateurs",
  settings: "Paramètres",
  edit: "Modifier",
  "my-pages": "Mes Pages",
  "my-booking": "Mes Réservations",
};

// ─── Quick links (Cmd+K command palette) ────────────────────

export const QUICK_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mes tâches", href: "/tasks", icon: ListTodo },
  { label: "Formations", href: "/formations", icon: BookOpen },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "MateuzsIA", href: "/ai", icon: Sparkles },
  { label: "Calendrier", href: "/calendar", icon: CalendarDays },
  { label: "Certificats", href: "/certificates", icon: Award },
  { label: "Classement", href: "/leaderboard", icon: Trophy },
  { label: "Ma progression", href: "/progress", icon: TrendingUp },
  { label: "Profil", href: "/profile", icon: User },
  { label: "Paramètres", href: "/settings", icon: Settings },
];
