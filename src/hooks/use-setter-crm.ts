"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useAuth } from "./use-auth";
import { toast } from "sonner";
import type {
  PipelineColumn,
  SetterLead,
  SetterActivity,
} from "@/types/setter-crm";
import { DEFAULT_PIPELINE_COLUMNS } from "@/types/setter-crm";

// ─── Pipeline Columns ─────────────────────────────────────────

export function usePipelineColumns(clientId?: string | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const columnsQuery = useQuery({
    queryKey: ["pipeline-columns", clientId],
    queryFn: async () => {
      let query = supabase
        .from("pipeline_columns")
        .select("*")
        .order("position", { ascending: true });

      if (clientId) {
        query = query.eq("client_id", clientId);
      } else {
        query = query.is("client_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Auto-seed les colonnes par defaut si vide
      if (!data || data.length === 0) {
        const toInsert = DEFAULT_PIPELINE_COLUMNS.map((col) => ({
          ...col,
          client_id: clientId ?? null,
        }));

        const { data: seeded, error: seedError } = await supabase
          .from("pipeline_columns")
          .insert(toInsert)
          .select("*")
          .order("position", { ascending: true });

        if (seedError) throw seedError;
        return (seeded ?? []) as PipelineColumn[];
      }

      return data as PipelineColumn[];
    },
    enabled: !!user,
  });

  return {
    columns: columnsQuery.data ?? [],
    isLoading: columnsQuery.isLoading,
    refetch: columnsQuery.refetch,
  };
}

export function useCreatePipelineColumn() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      column: Pick<PipelineColumn, "name" | "color" | "position"> & {
        client_id?: string | null;
        is_terminal?: boolean;
      },
    ) => {
      const { data, error } = await supabase
        .from("pipeline_columns")
        .insert(column)
        .select()
        .single();
      if (error) throw error;
      return data as PipelineColumn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-columns"] });
      toast.success("Colonne ajoutee");
    },
    onError: () => toast.error("Erreur lors de la creation de la colonne"),
  });
}

export function useUpdatePipelineColumn() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<PipelineColumn> & { id: string }) => {
      const { error } = await supabase
        .from("pipeline_columns")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-columns"] });
      toast.success("Colonne mise à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

export function useDeletePipelineColumn() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pipeline_columns")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-columns"] });
      toast.success("Colonne supprimee");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}

export function useReorderPipelineColumns() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (columns: { id: string; position: number }[]) => {
      // Mise à jour en batch via Promise.all
      const updates = columns.map(({ id, position }) =>
        supabase.from("pipeline_columns").update({ position }).eq("id", id),
      );
      const results = await Promise.all(updates);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const failed = results.find((r: any) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-columns"] });
    },
    onError: () => toast.error("Erreur lors du reordonnancement"),
  });
}

// ─── Setter Leads ─────────────────────────────────────────────

interface SetterLeadFilters {
  setterId?: string;
  clientId?: string;
  columnId?: string;
}

export function useSetterLeads(filters?: SetterLeadFilters) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const { user } = useAuth();

  const leadsQuery = useQuery({
    queryKey: ["setter-leads", filters],
    queryFn: async () => {
      let query = supabase
        .from("setter_leads")
        .select("*")
        .order("updated_at", { ascending: false });

      if (filters?.setterId) {
        query = query.eq("setter_id", filters.setterId);
      }
      if (filters?.clientId) {
        query = query.eq("client_id", filters.clientId);
      } else {
        // Sans filtre clientId → ne montrer que les leads sans client (admin/setter)
        query = query.is("client_id", null);
      }
      if (filters?.columnId) {
        query = query.eq("column_id", filters.columnId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as SetterLead[];
    },
    enabled: !!user,
  });

  return {
    leads: leadsQuery.data ?? [],
    isLoading: leadsQuery.isLoading,
    refetch: leadsQuery.refetch,
  };
}

export function useCreateSetterLead() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      lead: Omit<
        SetterLead,
        "id" | "created_at" | "updated_at" | "setter_id"
      > & {
        setter_id?: string;
      },
    ) => {
      const { data, error } = await supabase
        .from("setter_leads")
        .insert({ ...lead, setter_id: lead.setter_id ?? user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as SetterLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setter-leads"] });
      toast.success("Lead ajoute");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Erreur: ${msg}`);
    },
  });
}

export function useUpdateSetterLead() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<SetterLead> & { id: string }) => {
      const { error } = await supabase
        .from("setter_leads")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setter-leads"] });
      toast.success("Lead mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour du lead"),
  });
}

export function useDeleteSetterLead() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("setter_leads")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setter-leads"] });
      toast.success("Lead supprime");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}

export function useMoveSetterLeadToColumn() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      columnId,
    }: {
      id: string;
      columnId: string | null;
    }) => {
      const { error } = await supabase
        .from("setter_leads")
        .update({ column_id: columnId, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, columnId }) => {
      await queryClient.cancelQueries({ queryKey: ["setter-leads"] });
      const previous = queryClient.getQueryData<SetterLead[]>(["setter-leads"]);
      queryClient.setQueryData<SetterLead[]>(["setter-leads"], (old) =>
        (old ?? []).map((l) =>
          l.id === id ? { ...l, column_id: columnId } : l,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["setter-leads"], context.previous);
      }
      toast.error("Erreur lors du deplacement du lead");
    },
    onSettled: async (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["setter-leads"] });

      // Ne pas creer de closer call si le move a echoue
      if (_error || !variables.columnId) return;

      // Auto-creer un closer call quand le lead passe dans une colonne terminale
      try {
        const { data: col } = await supabase
          .from("pipeline_columns")
          .select("is_terminal")
          .eq("id", variables.columnId)
          .single();

        if (!col?.is_terminal) return;

        // Verifier qu'un closer call n'existe pas deja pour ce lead
        const { data: existing } = await supabase
          .from("closer_calls")
          .select("id")
          .eq("lead_id", variables.id)
          .limit(1);

        if (existing && existing.length > 0) return;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split("T")[0];

        // Recuperer le client_id du lead pour le propager au closer call
        const { data: lead } = await supabase
          .from("setter_leads")
          .select("client_id")
          .eq("id", variables.id)
          .single();

        await supabase.from("closer_calls").insert({
          lead_id: variables.id,
          client_id: lead?.client_id ?? null,
          date: dateStr,
          status: "a_venir",
          revenue: 0,
        } as never);

        queryClient.invalidateQueries({ queryKey: ["closer-calls"] });
        toast.success("Appel closing cree automatiquement");
      } catch (err) {
        console.error("Auto-creation closer call echouee:", err);
      }
    },
  });
}

// ─── Setter Activities (Bilan) ────────────────────────────────

interface SetterActivityFilters {
  userId?: string;
  clientId?: string;
}

export function useSetterActivities(filters?: SetterActivityFilters) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const { user } = useAuth();

  const activitiesQuery = useQuery({
    queryKey: ["setter-activities", filters],
    queryFn: async () => {
      let query = supabase
        .from("setter_activities")
        .select("*")
        .order("date", { ascending: false });

      if (filters?.userId) {
        query = query.eq("user_id", filters.userId);
      }
      if (filters?.clientId) {
        query = query.eq("client_id", filters.clientId);
      } else {
        query = query.is("client_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as SetterActivity[];
    },
    enabled: !!user,
  });

  return {
    activities: activitiesQuery.data ?? [],
    isLoading: activitiesQuery.isLoading,
    refetch: activitiesQuery.refetch,
  };
}

export function useCreateSetterActivity() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      activity: Omit<SetterActivity, "id" | "created_at" | "user_id"> & {
        user_id?: string;
      },
    ) => {
      const { data, error } = await supabase
        .from("setter_activities")
        .insert({ ...activity, user_id: activity.user_id ?? user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as SetterActivity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setter-activities"] });
      queryClient.invalidateQueries({ queryKey: ["setter-stats"] });
      toast.success("Activite enregistree");
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });
}

// ─── Update Setter Activity ───────────────────────────────────

export function useUpdateSetterActivity() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<SetterActivity> & { id: string }) => {
      const { data, error } = await supabase
        .from("setter_activities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as SetterActivity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setter-activities"] });
      queryClient.invalidateQueries({ queryKey: ["setter-stats"] });
    },
    onError: () => toast.error("Erreur lors de la mise a jour"),
  });
}

// ─── Delete Setter Activity ───────────────────────────────────

export function useDeleteSetterActivity() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("setter_activities")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setter-activities"] });
      queryClient.invalidateQueries({ queryKey: ["setter-stats"] });
      toast.success("Activite supprimee");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}

// ─── Setter Stats ─────────────────────────────────────────────

interface SetterStats {
  semaine: {
    dms_sent: number;
    followups_sent: number;
    links_sent: number;
    calls_booked: number;
  };
  mois: {
    dms_sent: number;
    followups_sent: number;
    links_sent: number;
    calls_booked: number;
  };
}

export function useSetterStats(userId?: string, clientId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabase() as any;
  const { user } = useAuth();

  return useQuery({
    queryKey: ["setter-stats", userId ?? "all", clientId],
    queryFn: async () => {
      const now = new Date();

      // Debut de la semaine (lundi)
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - diffToMonday);
      weekStart.setHours(0, 0, 0, 0);

      // Debut du mois
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let weekQuery = supabase
        .from("setter_activities")
        .select("dms_sent, followups_sent, links_sent, calls_booked")
        .gte("date", weekStart.toISOString().split("T")[0]);

      let monthQuery = supabase
        .from("setter_activities")
        .select("dms_sent, followups_sent, links_sent, calls_booked")
        .gte("date", monthStart.toISOString().split("T")[0]);

      // Filtrer par client_id
      if (clientId) {
        weekQuery = weekQuery.eq("client_id", clientId);
        monthQuery = monthQuery.eq("client_id", clientId);
      } else {
        weekQuery = weekQuery.is("client_id", null);
        monthQuery = monthQuery.is("client_id", null);
      }

      // Si un userId specifique est demande, filtrer par user
      if (userId) {
        weekQuery = weekQuery.eq("user_id", userId);
        monthQuery = monthQuery.eq("user_id", userId);
      }

      const [weekResult, monthResult] = await Promise.all([
        weekQuery,
        monthQuery,
      ]);

      if (weekResult.error) throw weekResult.error;
      if (monthResult.error) throw monthResult.error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sumFields = (rows: any[]) => ({
        dms_sent: rows.reduce((s: number, r: any) => s + (r.dms_sent ?? 0), 0),
        followups_sent: rows.reduce(
          (s: number, r: any) => s + (r.followups_sent ?? 0),
          0,
        ),
        links_sent: rows.reduce(
          (s: number, r: any) => s + (r.links_sent ?? 0),
          0,
        ),
        calls_booked: rows.reduce(
          (s: number, r: any) => s + (r.calls_booked ?? 0),
          0,
        ),
      });

      return {
        semaine: sumFields(weekResult.data ?? []),
        mois: sumFields(monthResult.data ?? []),
      } as SetterStats;
    },
    enabled: !!user,
  });
}
