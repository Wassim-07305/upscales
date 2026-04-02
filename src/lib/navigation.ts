import {
  LayoutDashboard,
  Users,
  MessageSquare,
  GraduationCap,
  FileText,
  Bot,
  BarChart3,
  CreditCard,
  Receipt,
  UserPlus,
  ClipboardCheck,
  Target,
  Bell,
  Video,
  Trophy,
  Crown,
  PenLine,
  Gift,
  Phone,
  Send,
  CalendarCheck,
  Clock,
  Kanban,
  Award,
  FolderOpen,
  FileSignature,
  Calculator,
  Contact,
  Star,
  Map,
  TrendingUp,
  Palette,
  PhoneCall,
  Presentation,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  section?: string;
  /** Affiche l'item indenté (sous-item visuel) */
  indent?: boolean;
}

/** Admin / Fondateur */
export const adminNavigation: NavItem[] = [
  // ── Pilotage ──
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    section: "Pilotage",
  },
  { name: "Personnes", href: "/admin/personnes", icon: Users },
  { name: "Finances", href: "/admin/billing", icon: BarChart3 },
  { name: "CRM", href: "/admin/crm", icon: Kanban },
  { name: "Appels Closing", href: "/admin/closer-calls", icon: PhoneCall },
  { name: "Messagerie", href: "/admin/messaging", icon: MessageSquare },

  // ── Contenu ──
  {
    name: "Formation",
    href: "/admin/school",
    icon: GraduationCap,
    section: "Contenu",
  },
  { name: "Communaute", href: "/admin/community", icon: Users },
  { name: "Ressources", href: "/admin/resources", icon: FolderOpen },
  { name: "AlexIA", href: "/admin/ai", icon: Bot },
  { name: "Formulaires", href: "/admin/forms", icon: FileText },

  // ── Business ──
  {
    name: "Booking",
    href: "/admin/booking",
    icon: CalendarCheck,
  },
  { name: "Appels & Lives", href: "/admin/calls", icon: Phone },

  // ── Administration ──
  {
    name: "Gamification & Defis",
    href: "/admin/rewards",
    icon: Trophy,
    section: "Administration",
  },
  { name: "Miro", href: "/admin/miro", icon: Presentation },
  { name: "Systeme", href: "/admin/system", icon: Activity },
];

/** Coach / CSM */
export const coachNavigation: NavItem[] = [
  // ── Pilotage ──
  {
    name: "Dashboard",
    href: "/coach/dashboard",
    icon: LayoutDashboard,
    section: "Pilotage",
  },
  { name: "Personnes", href: "/coach/personnes", icon: Users },
  { name: "Appels & Lives", href: "/coach/calls", icon: Phone },
  { name: "Messagerie", href: "/coach/messaging", icon: MessageSquare },
  { name: "Check-ins", href: "/coach/checkins", icon: ClipboardCheck },

  // ── Contenu ──
  {
    name: "Formation",
    href: "/coach/school",
    icon: GraduationCap,
    section: "Contenu",
  },
  { name: "AlexIA", href: "/coach/ai", icon: Bot },
  { name: "Formulaires", href: "/coach/forms", icon: FileText },
  { name: "Booking", href: "/coach/booking", icon: CalendarCheck },
  { name: "Communaute", href: "/coach/community", icon: Users },
  { name: "Ressources", href: "/coach/resources", icon: FolderOpen },

  // ── Gestion ──
  {
    name: "Gamification & Defis",
    href: "/coach/gamification",
    icon: Trophy,
    section: "Gestion",
  },
];

/** Setter */
export const setterNavigation: NavItem[] = [
  // ── Ventes ──
  {
    name: "Dashboard",
    href: "/sales/dashboard",
    icon: LayoutDashboard,
    section: "Ventes",
  },
  { name: "CRM", href: "/sales/crm", icon: Kanban },
  { name: "Appels Closing", href: "/sales/closer-calls", icon: PhoneCall },
  { name: "Commissions", href: "/sales/commissions", icon: Receipt },

  // ── Communication ──
  {
    name: "Messagerie",
    href: "/sales/messaging",
    icon: MessageSquare,
    section: "Communication",
  },
  { name: "Ressources", href: "/sales/resources", icon: FolderOpen },
];

/** Closer — meme nav que setter */
export const closerNavigation: NavItem[] = setterNavigation;

/** Sales par defaut (fallback si role inconnu) */
export const salesNavigation: NavItem[] = closerNavigation;

/** Client / Freelance */
export const clientNavigation: NavItem[] = [
  // ── Mon Espace ──
  {
    name: "Dashboard",
    href: "/client/dashboard",
    icon: LayoutDashboard,
    section: "Mon Espace",
  },
  { name: "Formation", href: "/client/school", icon: GraduationCap },
  { name: "CRM", href: "/client/pipeline", icon: Kanban },
  { name: "Appels Closing", href: "/client/closer-calls", icon: PhoneCall },
  { name: "Messagerie", href: "/client/messaging", icon: MessageSquare },

  // ── Progression ──
  {
    name: "Ma Progression",
    href: "/client/progression",
    icon: Trophy,
    section: "Progression",
  },
  { name: "Journal & Suivi", href: "/client/journal", icon: PenLine },
  { name: "Classement", href: "/client/leaderboard", icon: Crown },
  { name: "AlexIA", href: "/client/ai", icon: Bot },
  { name: "Ressources", href: "/client/resources", icon: FolderOpen },

  // ── Business ──
  {
    name: "Communaute",
    href: "/client/community",
    icon: Users,
    section: "Business",
  },
  {
    name: "Documents",
    href: "/client/documents",
    icon: FileSignature,
  },
  { name: "Appels & Lives", href: "/client/calendar", icon: PhoneCall },

  // ── Outils ──
  {
    name: "Calculateur",
    href: "/client/tools",
    icon: Calculator,
    section: "Outils",
  },
];

/** Prospect (client potentiel — meme sidebar que client, acces limites avec blur) */
export const prospectNavigation: NavItem[] = clientNavigation;

export type RoleVariant = "admin" | "coach" | "sales" | "client" | "prospect";

export function getNavigationForRole(
  variant: RoleVariant,
  appRole?: string | null,
): NavItem[] {
  switch (variant) {
    case "admin":
      return adminNavigation;
    case "coach":
      return coachNavigation;
    case "sales":
      // Differencier setter et closer
      if (appRole === "setter") return setterNavigation;
      if (appRole === "closer") return closerNavigation;
      return salesNavigation;
    case "prospect":
      return prospectNavigation;
    case "client":
      return clientNavigation;
  }
}

/** Per-role mobile bottom bar: the 5 most important hrefs */
const MOBILE_NAV_HREFS: Partial<Record<RoleVariant, string[]>> = {
  admin: [
    "/admin/dashboard",
    "/admin/crm",
    "/admin/messaging",
    "/admin/school",
    "/admin/billing",
  ],
};

/** Mobile nav shows max 5 items, with per-role overrides */
export function getMobileNavForRole(
  variant: RoleVariant,
  appRole?: string | null,
): NavItem[] {
  const overrides = MOBILE_NAV_HREFS[variant];
  if (overrides) {
    const allItems = getNavigationForRole(variant, appRole);
    return overrides
      .map((href) => allItems.find((item) => item.href === href))
      .filter((item): item is NavItem => item !== undefined);
  }
  return getNavigationForRole(variant, appRole).slice(0, 5);
}

/** Where each role lands after login */
export function getDefaultRouteForRole(role: string): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "coach":
      return "/coach/dashboard";
    case "setter":
    case "closer":
      return "/sales/dashboard";
    case "client":
    case "prospect":
      return "/client/dashboard";
    default:
      return "/login";
  }
}

/** Which route prefix is allowed for a given role */
export function getRoutePrefix(role: string): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "coach":
      return "/coach";
    case "setter":
    case "closer":
      return "/sales";
    case "client":
    case "prospect":
      return "/client";
    default:
      return "";
  }
}
