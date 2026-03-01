import type { LucideIcon } from "lucide-react";

// ─── Navigation ─────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}
