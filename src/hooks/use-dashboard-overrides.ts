"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

/**
 * Cles des overrides manuels du dashboard.
 * Stockees dans app_settings avec le prefixe "dashboard_".
 */
export const DASHBOARD_OVERRIDE_KEYS = [
  "dashboard_revenue",
  "dashboard_cash_invoiced",
  "dashboard_cash_collected",
  "dashboard_ltv",
  "dashboard_closing_rate",
  "dashboard_completion_rate",
] as const;

export type DashboardOverrideKey = (typeof DASHBOARD_OVERRIDE_KEYS)[number];

export interface DashboardOverrides {
  dashboard_revenue: number | null;
  dashboard_cash_invoiced: number | null;
  dashboard_cash_collected: number | null;
  dashboard_ltv: number | null;
  dashboard_closing_rate: number | null;
  dashboard_completion_rate: number | null;
}

const LABELS: Record<DashboardOverrideKey, string> = {
  dashboard_revenue: "CA du mois (EUR)",
  dashboard_cash_invoiced: "Cash facture (EUR)",
  dashboard_cash_collected: "Cash encaisse (EUR)",
  dashboard_ltv: "LTV moyen (EUR)",
  dashboard_closing_rate: "Taux de closing (%)",
  dashboard_completion_rate: "Completion formations (%)",
};

export function getOverrideLabel(key: DashboardOverrideKey): string {
  return LABELS[key];
}

const EMPTY_OVERRIDES: DashboardOverrides = {
  dashboard_revenue: null,
  dashboard_cash_invoiced: null,
  dashboard_cash_collected: null,
  dashboard_ltv: null,
  dashboard_closing_rate: null,
  dashboard_completion_rate: null,
};

export function useDashboardOverrides() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["dashboard-overrides"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", [...DASHBOARD_OVERRIDE_KEYS]);

      if (error) throw error;

      const overrides = { ...EMPTY_OVERRIDES };
      for (const row of data ?? []) {
        const key = row.key as DashboardOverrideKey;
        if (key in overrides) {
          const num = parseFloat(row.value);
          overrides[key] = isNaN(num) ? null : num;
        }
      }
      return overrides;
    },
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<DashboardOverrides>) => {
      const entries = Object.entries(updates) as [
        DashboardOverrideKey,
        number | null,
      ][];

      for (const [key, value] of entries) {
        if (value === null || value === undefined) {
          // Supprimer l'override
          await supabase.from("app_settings").delete().eq("key", key);
        } else {
          // Upsert la valeur
          const { error } = await supabase.from("app_settings").upsert(
            {
              key,
              value: String(value),
              description: getOverrideLabel(key),
              is_secret: false,
            },
            { onConflict: "key" },
          );
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-overrides"] });
      toast.success("Donnees mises a jour");
    },
    onError: () => {
      toast.error("Erreur lors de la sauvegarde");
    },
  });

  return {
    overrides: query.data ?? EMPTY_OVERRIDES,
    isLoading: query.isLoading,
    saveOverrides: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
