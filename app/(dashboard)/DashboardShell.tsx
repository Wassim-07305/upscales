"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  NAV_SECTIONS,
  NAV_ITEMS,
  QUICK_LINKS,
  BREADCRUMB_LABELS,
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
  return (
    <AppShell
      role={role}
      userName={userName}
      email={email}
      avatarUrl={avatarUrl}
      userId={userId}
      navSections={NAV_SECTIONS}
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
