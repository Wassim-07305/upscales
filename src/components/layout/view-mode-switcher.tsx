"use client";

import { Building2, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/stores/ui-store";
import { useMembers } from "@/hooks/use-members";
import { useQueryClient } from "@tanstack/react-query";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types/database";

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "client", label: "Client" },
  { value: "prospect", label: "Prospect" },
  { value: "coach", label: "Coach" },
  { value: "setter", label: "Setter" },
  { value: "closer", label: "Closer" },
];

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: "/admin/dashboard",
  coach: "/coach/dashboard",
  setter: "/sales/pipeline",
  closer: "/sales/pipeline",
  client: "/client/goals",
  prospect: "/prospect/dashboard",
};

export function ViewModeSwitcher() {
  const { realProfile, isImpersonating } = useAuth();
  const {
    impersonatedProfile,
    impersonatedRole,
    setImpersonation,
    clearImpersonation,
    setImpersonatedRole,
  } = useUIStore();
  const { members } = useMembers();
  const queryClient = useQueryClient();
  // Visible uniquement pour les vrais admins
  if (realProfile?.role !== "admin") return null;

  const isPortalActive = isImpersonating || impersonatedRole !== null;

  const filteredMembers = impersonatedRole
    ? members.filter((m) => m.role === impersonatedRole)
    : [];

  const personOptions = filteredMembers.map((m) => ({
    value: m.id,
    label: m.full_name || "Sans nom",
  }));

  const handleSwitchToAdmin = () => {
    clearImpersonation();
    queryClient.clear();
    window.location.href = "/admin/dashboard";
  };

  const handleSwitchToPortal = () => {
    if (!isPortalActive) {
      setImpersonatedRole("client");
    }
  };

  const handleRoleChange = (role: string) => {
    const wasImpersonating = !!impersonatedProfile;
    setImpersonatedRole(role as AppRole);
    // Si on etait en impersonation, revenir sur le dashboard admin
    if (wasImpersonating) {
      queryClient.clear();
      window.location.href = "/admin/dashboard";
    }
  };

  const handlePersonChange = (personId: string) => {
    const member = members.find((m) => m.id === personId);
    if (!member) return;

    // Construire un profil pour l'impersonation
    setImpersonation({
      id: member.id,
      full_name: member.full_name,
      avatar_url: member.avatar_url,
      role: member.role as AppRole,
      email: "",
      phone: null,
      bio: member.bio,
      timezone: "Europe/Paris",
      default_currency: "EUR",
      onboarding_completed: true,
      onboarding_step: 0,
      onboarding_offer_id: null,
      onboarding_answers: null,
      onboarding_completed_at: null,
      ai_consent_given_at: null,
      ai_consent_scope: [],
      leaderboard_anonymous: false,
      anonymous_alias: null,
      last_seen_at: null,
      created_at: member.created_at,
      updated_at: member.created_at,
    });
    queryClient.clear();

    const dashboard = ROLE_DASHBOARDS[member.role] ?? "/client/goals";
    window.location.href = dashboard;
  };

  return (
    <div className="hidden md:flex items-center gap-2">
      {/* Bouton Admin */}
      <button
        type="button"
        onClick={handleSwitchToAdmin}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
          !isPortalActive
            ? "bg-primary text-white shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Building2 className="h-4 w-4" />
        Admin
      </button>

      {/* Bouton Portail */}
      <button
        type="button"
        onClick={handleSwitchToPortal}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
          isPortalActive
            ? "bg-primary text-white shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <User className="h-4 w-4" />
        Portail
      </button>

      {/* Selects role + personne — visibles uniquement en mode portail */}
      {isPortalActive && (
        <>
          <Select
            options={ROLE_OPTIONS}
            value={impersonatedRole ?? undefined}
            onChange={handleRoleChange}
            placeholder="Role..."
            className="w-32 h-8 text-xs"
          />
          <Select
            options={personOptions}
            value={impersonatedProfile?.id ?? undefined}
            onChange={handlePersonChange}
            placeholder="Personne..."
            className="w-44 h-8 text-xs"
            disabled={!impersonatedRole || personOptions.length === 0}
          />
        </>
      )}
    </div>
  );
}
