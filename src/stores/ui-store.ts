"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile, AppRole } from "@/types/database";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  notificationPanelOpen: boolean;
  setNotificationPanelOpen: (open: boolean) => void;

  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Impersonation admin
  impersonatedProfile: Profile | null;
  impersonatedRole: AppRole | null;
  setImpersonation: (profile: Profile) => void;
  clearImpersonation: () => void;
  setImpersonatedRole: (role: AppRole | null) => void;

  // Objectif mensuel admin
  monthlyObjective: number;
  setMonthlyObjective: (value: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      notificationPanelOpen: false,
      setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),

      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

      // Impersonation admin
      impersonatedProfile: null,
      impersonatedRole: null,
      setImpersonation: (profile) =>
        set({ impersonatedProfile: profile, impersonatedRole: profile.role }),
      clearImpersonation: () =>
        set({ impersonatedProfile: null, impersonatedRole: null }),
      setImpersonatedRole: (role) =>
        set({ impersonatedRole: role, impersonatedProfile: null }),

      // Objectif mensuel admin
      monthlyObjective: 10000,
      setMonthlyObjective: (value) => set({ monthlyObjective: value }),
    }),
    {
      name: "om-ui-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        impersonatedProfile: state.impersonatedProfile,
        impersonatedRole: state.impersonatedRole,
        monthlyObjective: state.monthlyObjective,
      }),
    },
  ),
);
