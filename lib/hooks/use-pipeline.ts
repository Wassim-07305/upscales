"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { PipelineColumn } from "@/lib/types/database";
import { DEFAULT_PIPELINE_COLUMNS } from "@/lib/constants/crm";
import { toast } from "sonner";

function db() { return createClient(); }

// ─── Pipeline Columns ───────────────────────────────────

export function usePipelineColumns(clientId: string | null) {
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
        const cols = DEFAULT_PIPELINE_COLUMNS.map((c, i) => ({
          client_id: clientId,
          name: c.name,
          color: c.color,
          position: i,
        }));
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipeline-columns"] });
      toast.success("Colonne créée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePipelineColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PipelineColumn> & { id: string }) => {
      const { error } = await db().from("pipeline_columns").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipeline-columns"] });
      toast.success("Colonne mise à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePipelineColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from("pipeline_columns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipeline-columns"] });
      toast.success("Colonne supprimée");
    },
    onError: (e: Error) => toast.error(e.message),
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
