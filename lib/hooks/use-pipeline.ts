"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { PipelineColumn, Lead } from "@/lib/types/database";

function db() { return createClient(); }

const DEFAULT_COLUMNS = [
  { name: "En discussion", color: "#60a5fa", position: 0 },
  { name: "Lien envoyé", color: "#818cf8", position: 1 },
  { name: "Call booké", color: "#a855f7", position: 2 },
  { name: "En réflexion", color: "#f59e0b", position: 3 },
  { name: "Closé", color: "#10b981", position: 4 },
  { name: "Perdu", color: "#71717a", position: 5 },
];

// ─── Pipeline Columns ───────────────────────────────────

export function usePipelineColumns(clientId: string | null) {
  const qc = useQueryClient();

  return useQuery({
    queryKey: ["pipeline-columns", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await db()
        .from("pipeline_columns")
        .select("*")
        .eq("client_id", clientId)
        .order("position", { ascending: true });
      if (error) throw error;

      // Auto-seed default columns if empty
      if (!data || data.length === 0) {
        const cols = DEFAULT_COLUMNS.map((c) => ({ ...c, client_id: clientId }));
        const { data: seeded, error: seedErr } = await db()
          .from("pipeline_columns")
          .insert(cols)
          .select();
        if (seedErr) throw seedErr;
        return (seeded || []) as PipelineColumn[];
      }

      return data as PipelineColumn[];
    },
    enabled: !!clientId,
  });
}

export function useCreatePipelineColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (col: Partial<PipelineColumn>) => {
      const { data, error } = await db().from("pipeline_columns").insert(col).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline-columns"] }),
  });
}

export function useUpdatePipelineColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PipelineColumn> & { id: string }) => {
      const { error } = await db().from("pipeline_columns").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline-columns"] }),
  });
}

export function useDeletePipelineColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from("pipeline_columns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline-columns"] }),
  });
}

export function useReorderPipelineColumns() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (columns: { id: string; position: number }[]) => {
      await Promise.all(
        columns.map((c) => db().from("pipeline_columns").update({ position: c.position }).eq("id", c.id))
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline-columns"] }),
  });
}

// ─── Pipeline Leads ─────────────────────────────────────

export function usePipelineLeads(clientId: string | null) {
  return useQuery({
    queryKey: ["pipeline-leads", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await db()
        .from("leads")
        .select("*")
        .eq("client_id", clientId)
        .order("sort_order", { ascending: true })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Lead[];
    },
    enabled: !!clientId,
  });
}

export function useCreatePipelineLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      const { data, error } = await db().from("leads").insert(lead).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline-leads"] }),
  });
}

export function useUpdatePipelineLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { error } = await db().from("leads").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipeline-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
    },
  });
}

export function useDeletePipelineLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipeline-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
    },
  });
}

// ─── Move Lead to Column (with auto-actions) ────────────

export function useMovePipelineLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      columnId,
      columnName,
      clientId,
    }: {
      leadId: string;
      columnId: string;
      columnName: string;
      clientId: string;
    }) => {
      // Update lead column
      const { error } = await db()
        .from("leads")
        .update({ column_id: columnId })
        .eq("id", leadId);
      if (error) throw error;

      const lowerName = columnName.toLowerCase();

      // Auto-create call_calendar when moved to "Call booké"
      if (lowerName.includes("call") && lowerName.includes("book")) {
        await db().from("call_calendar").insert({
          client_id: clientId,
          lead_id: leadId,
          date: new Date().toISOString().split("T")[0],
          type: "manuel",
          status: "planifié",
        });
      }

      // Auto-create closer_call when moved to "Closé"
      if (lowerName.includes("clos")) {
        const { data: lead } = await db().from("leads").select("ca_contracte, ca_collecte").eq("id", leadId).single();
        await db().from("closer_calls").insert({
          client_id: clientId,
          lead_id: leadId,
          date: new Date().toISOString().split("T")[0],
          status: "closé",
          revenue: lead?.ca_contracte || 0,
        });
        // Auto-create financial entry
        if (lead?.ca_contracte && lead.ca_contracte > 0) {
          await db().from("financial_entries").insert({
            client_id: clientId,
            type: "ca",
            label: `Close lead`,
            amount: lead.ca_contracte,
            date: new Date().toISOString().split("T")[0],
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipeline-leads"] });
      qc.invalidateQueries({ queryKey: ["call-calendar"] });
      qc.invalidateQueries({ queryKey: ["closer-calls"] });
      qc.invalidateQueries({ queryKey: ["financial-entries"] });
      qc.invalidateQueries({ queryKey: ["closing-rates"] });
    },
  });
}

// ─── Pipeline Stats ─────────────────────────────────────

export function usePipelineStats(clientId: string | null) {
  return useQuery({
    queryKey: ["pipeline-stats", clientId],
    queryFn: async () => {
      if (!clientId) return { total: 0, ca_contracte: 0, ca_collecte: 0, relances_today: 0 };
      const { data } = await db().from("leads").select("ca_contracte, ca_collecte, date_relance, status").eq("client_id", clientId);
      const leads = data || [];
      const today = new Date().toISOString().split("T")[0];
      return {
        total: leads.length,
        ca_contracte: leads.reduce((s, l) => s + (Number(l.ca_contracte) || 0), 0),
        ca_collecte: leads.reduce((s, l) => s + (Number(l.ca_collecte) || 0), 0),
        relances_today: leads.filter((l) => l.date_relance && l.date_relance <= today && l.status !== "close" && l.status !== "perdu").length,
      };
    },
    enabled: !!clientId,
  });
}
