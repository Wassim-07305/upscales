"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CloserCall } from "@/lib/types/database";
import { toast } from "sonner";

function db() { return createClient(); }

interface CloserCallFilters {
  clientId?: string;
  status?: string;
  closerId?: string;
}

export function useCloserCalls(filters?: CloserCallFilters) {
  return useQuery({
    queryKey: ["closer-calls", filters],
    queryFn: async () => {
      let query = db()
        .from("closer_calls")
        .select("*, client:clients(id, name), lead:leads(full_name), closer:profiles!closer_calls_closer_id_fkey(id, full_name, avatar_url)")
        .order("date", { ascending: false });

      if (filters?.clientId) query = query.eq("client_id", filters.clientId);
      if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
      if (filters?.closerId) query = query.eq("closer_id", filters.closerId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CloserCall[];
    },
  });
}

export function useCloserCallStats(filters?: CloserCallFilters) {
  return useQuery({
    queryKey: ["closer-call-stats", filters],
    queryFn: async () => {
      let query = db().from("closer_calls").select("status, revenue, client_id");
      if (filters?.clientId) query = query.eq("client_id", filters.clientId);
      if (filters?.closerId) query = query.eq("closer_id", filters.closerId);
      const { data, error } = await query;
      if (error) throw error;

      const calls = data || [];
      const closed = calls.filter((c) => c.status === "closé" || c.status === "paiement_reussi");
      const total = calls.length;
      const caTotal = closed.reduce((s, c) => s + (Number(c.revenue) || 0), 0);
      return {
        total,
        closed: closed.length,
        ca_total: caTotal,
        taux_closing: total > 0 ? Math.round((closed.length / total) * 100) : 0,
        panier_moyen: closed.length > 0 ? Math.round(caTotal / closed.length) : 0,
      };
    },
  });
}

export function useCreateCloserCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (call: Partial<CloserCall>) => {
      const { data, error } = await db().from("closer_calls").insert(call).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closer-calls"] });
      qc.invalidateQueries({ queryKey: ["closer-call-stats"] });
      qc.invalidateQueries({ queryKey: ["closing-rates"] });
      toast.success("Closer call ajouté");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCloserCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CloserCall> & { id: string }) => {
      const { error } = await db().from("closer_calls").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closer-calls"] });
      qc.invalidateQueries({ queryKey: ["closer-call-stats"] });
      qc.invalidateQueries({ queryKey: ["closing-rates"] });
      toast.success("Closer call mis à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCloserCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from("closer_calls").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closer-calls"] });
      qc.invalidateQueries({ queryKey: ["closer-call-stats"] });
      qc.invalidateQueries({ queryKey: ["closing-rates"] });
      toast.success("Closer call supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
