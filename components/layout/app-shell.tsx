"use client";

import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { NotificationsPanel } from "@/components/layout/notifications-panel";
import dynamic from "next/dynamic";

const Sidebar = dynamic(
  () => import("@/components/layout/sidebar").then((m) => m.Sidebar),
  {
    ssr: false,
    loading: () => (
      <aside className="z-30 hidden md:flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar" />
    ),
  }
);
const MobileNav = dynamic(
  () => import("@/components/layout/mobile-nav").then((m) => m.MobileNav),
  { ssr: false }
);
const GlobalSearch = dynamic(
  () => import("@/components/layout/global-search").then((m) => m.GlobalSearch),
  { ssr: false }
);
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { useUIStore } from "@/lib/stores/ui-store";
import type { NavItem, NavSection } from "@/lib/types/appshell";
import type { LucideIcon } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface QuickLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

// ─── Props ──────────────────────────────────────────────────

interface AppShellProps {
  role: string;
  userName: string;
  email: string;
  avatarUrl?: string | null;
  userId: string;
  children: React.ReactNode;

  // ─── Configuration (specifique au projet) ─────────────────
  /** Sections de navigation pour la sidebar. */
  navSections: NavSection[];
  /** Liste plate de tous les elements de navigation pour la barre mobile. */
  navItems: NavItem[];
  /** Liens rapides pour la palette de commandes (Cmd+K). */
  quickLinks: QuickLink[];
  /** Labels du fil d'Ariane : segment URL → nom d'affichage. */
  breadcrumbLabels?: Record<string, string>;
  /** Chemin du logo. Par defaut : "/icons/icon-48x48.png" */
  logoSrc?: string;
  /** Nom de l'application affiche a cote du logo. Supporte le JSX. */
  appName?: React.ReactNode;
  /** Roles qui voient le lien Parametres. Par defaut : ["admin", "moderator"] */
  adminRoles?: string[];
}

// ─── ThemeProvider inline ────────────────────────────────────

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useUIStore();

  // Rehydrate Zustand persisted state after mount (skipHydration is enabled
  // to prevent SSR/client mismatch). This runs once at the top of the tree
  // so all child components (Sidebar, Header, etc.) get correct values.
  useEffect(() => {
    useUIStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme(resolvedTheme: "light" | "dark") {
      if (resolvedTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mq.matches ? "dark" : "light");

      const handler = (e: MediaQueryListEvent) =>
        applyTheme(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  return <>{children}</>;
}

// ─── Component ──────────────────────────────────────────────

export function AppShell({
  role,
  userName,
  email,
  avatarUrl,
  userId,
  children,
  navSections,
  navItems,
  quickLinks,
  breadcrumbLabels,
  logoSrc = "/icons/icon-48x48.png",
  appName = "UPSCALE",
  adminRoles,
}: AppShellProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  return (
    <ThemeProvider>
      <NavigationProgress />
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar
          role={role}
          userName={userName}
          avatarUrl={avatarUrl}
          navSections={navSections}
          logoSrc={logoSrc}
          appName={appName}
          adminRoles={adminRoles}
        />

        {/* Zone principale */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <Header
            userName={userName}
            email={email}
            avatarUrl={avatarUrl}
            role={role}
            userId={userId}
            unreadCount={unreadCount}
            breadcrumbLabels={breadcrumbLabels}
          />

          {/* Contenu */}
          <main className="flex-1 overflow-y-auto p-5 pb-20 md:p-8 md:pb-8">
            <div className="mx-auto max-w-[1400px]">{children}</div>
          </main>
        </div>

        {/* Navigation mobile en bas */}
        <MobileNav role={role} navItems={navItems} />

        {/* Overlays globaux */}
        <NotificationsPanel
          userId={userId}
          onUnreadCountChange={handleUnreadCountChange}
        />
        <GlobalSearch quickLinks={quickLinks} />
      </div>
    </ThemeProvider>
  );
}
