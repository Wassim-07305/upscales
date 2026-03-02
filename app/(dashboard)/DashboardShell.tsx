"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  ADMIN_SECTIONS,
  STUDENT_SECTIONS,
  NAV_ITEMS,
  QUICK_LINKS,
  BREADCRUMB_LABELS,
  ADMIN_ROLES,
} from "@/lib/constants/navigation";

interface DashboardShellProps {
  role: string;
  userName: string;
  email: string;
  avatarUrl?: string | null;
  userId: string;
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  userName,
  email,
  avatarUrl,
  userId,
  children,
}: DashboardShellProps) {
  const isAdmin = ADMIN_ROLES.includes(role);
  const navSections = isAdmin ? ADMIN_SECTIONS : STUDENT_SECTIONS;

  return (
    <AppShell
      role={role}
      userName={userName}
      email={email}
      avatarUrl={avatarUrl}
      userId={userId}
      navSections={navSections}
      navItems={NAV_ITEMS}
      quickLinks={QUICK_LINKS}
      breadcrumbLabels={BREADCRUMB_LABELS}
      logoSrc="/icons/icon-48x48.png"
      appName={
        <span className="font-display font-bold tracking-tight">UPSCALE</span>
      }
      adminRoles={["admin", "moderator"]}
    >
      {children}
    </AppShell>
  );
}
