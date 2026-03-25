"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Client, ClientAssignment } from "@/lib/types/database";

function getSupabase() { return createClient(); }

// ─── Fetch clients ──────────────────────────────────────

export function useClients(filters?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ["clients", filters],
    queryFn: async () => {
      let query = getSupabase()
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Client[];
    },
  });
}

export function useClient(id: string | null) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await getSupabase()
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Client;
    },
    enabled: !!id,
  });
}

// ─── Create / Update / Delete ───────────────────────────

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: Partial<Client>) => {
      const { data, error } = await getSupabase().from("clients").insert(client).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { error } = await getSupabase().from("clients").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client"] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
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
      const { data, error } = await getSupabase()
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
      const { data, error } = await getSupabase()
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
    mutationFn: async (assignment: { client_id: string; user_id: string; role: string }) => {
      const { error } = await getSupabase()
        .from("client_assignments")
        .upsert(assignment, { onConflict: "client_id,user_id,role" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-assignments"] });
      qc.invalidateQueries({ queryKey: ["all-client-assignments"] });
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from("client_assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-assignments"] });
      qc.invalidateQueries({ queryKey: ["all-client-assignments"] });
    },
  });
}

// ─── Closing rates ──────────────────────────────────────

export type ClosingRateMap = Record<string, { total: number; closed: number; rate: number }>;

export function useClosingRates() {
  return useQuery({
    queryKey: ["closing-rates"],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("closer_calls")
        .select("client_id, status");
      if (error) throw error;

      const map: ClosingRateMap = {};
      for (const call of data || []) {
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
