"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Client, ClientAssignment } from "@/lib/types/database";
import { toast } from "sonner";

function db() { return createClient(); }

// ─── Fetch clients ──────────────────────────────────────

export function useClients(filters?: { search?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: ["clients", filters],
    queryFn: async () => {
      let query = db()
        .from("clients")
        .select("*", { count: "exact" })
        .eq("is_internal", false)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data || []) as Client[], count: count ?? 0 };
    },
  });
}

export function useClientsList() {
  return useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await db()
        .from("clients")
        .select("id, name")
        .eq("is_internal", false)
        .order("name");
      if (error) throw error;
      return (data || []) as { id: string; name: string }[];
    },
  });
}

export function useClient(id: string | null) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await db().from("clients").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Client;
    },
    enabled: !!id,
  });
}

// ─── Mutations ──────────────────────────────────────────

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: Partial<Client>) => {
      const { data, error } = await db().from("clients").insert(client).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      toast.success("Client créé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { error } = await db().from("clients").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      qc.invalidateQueries({ queryKey: ["client"] });
      toast.success("Client mis à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      toast.success("Client supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Assignments ────────────────────────────────────────

export type AssignmentWithProfile = ClientAssignment & {
  profile: { id: string; full_name: string; avatar_url: string | null } | null;
};

export function useClientAssignments(clientId: string | null) {
  return useQuery({
    queryKey: ["client-assignments", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await db()
        .from("client_assignments")
        .select("*, profile:profiles(id, full_name, avatar_url)")
        .eq("client_id", clientId);
      if (error) throw error;
      return (data || []) as AssignmentWithProfile[];
    },
    enabled: !!clientId,
  });
}

export function useAllClientAssignments() {
  return useQuery({
    queryKey: ["all-client-assignments"],
    queryFn: async () => {
      const { data, error } = await db()
        .from("client_assignments")
        .select("*, profile:profiles(id, full_name, avatar_url)");
      if (error) throw error;
      return (data || []) as AssignmentWithProfile[];
    },
  });
}

export function useUpsertAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: { client_id: string; user_id: string; role: string }) => {
      const { error } = await db().from("client_assignments").upsert(a, { onConflict: "client_id,user_id,role" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-assignments"] });
      qc.invalidateQueries({ queryKey: ["all-client-assignments"] });
      toast.success("Membre assigné");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from("client_assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-assignments"] });
      qc.invalidateQueries({ queryKey: ["all-client-assignments"] });
      toast.success("Membre retiré");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Closing rates ──────────────────────────────────────

export type ClosingRateMap = Record<string, { total: number; closed: number; rate: number }>;

export function useClosingRates() {
  return useQuery({
    queryKey: ["closing-rates"],
    queryFn: async () => {
      const { data, error } = await db().from("closer_calls").select("client_id, status");
      if (error) throw error;
      const map: ClosingRateMap = {};
      for (const call of data || []) {
        if (!call.client_id) continue;
        if (!map[call.client_id]) map[call.client_id] = { total: 0, closed: 0, rate: 0 };
        map[call.client_id].total++;
        if (call.status === "closé" || call.status === "paiement_reussi") {
          map[call.client_id].closed++;
        }
      }
      for (const id of Object.keys(map)) {
        map[id].rate = map[id].total > 0 ? Math.round((map[id].closed / map[id].total) * 100) : 0;
      }
      return map;
    },
  });
}
