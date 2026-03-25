"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CloserCall } from "@/lib/types/database";

const supabase = createClient();

export function useCloserCalls(filters?: { clientId?: string; status?: string; closerId?: string }) {
  return useQuery({
    queryKey: ["closer-calls", filters],
    queryFn: async () => {
      let query = supabase
        .from("closer_calls")
        .select("*, lead:leads(full_name), closer:profiles!closer_calls_closer_id_fkey(id, full_name, avatar_url)")
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

export function useCreateCloserCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (call: Partial<CloserCall>) => {
      const { data, error } = await supabase.from("closer_calls").insert(call).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closer-calls"] });
      qc.invalidateQueries({ queryKey: ["closing-rates"] });
    },
  });
}

export function useUpdateCloserCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CloserCall> & { id: string }) => {
      const { error } = await supabase.from("closer_calls").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closer-calls"] });
      qc.invalidateQueries({ queryKey: ["closing-rates"] });
    },
  });
}

export function useDeleteCloserCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("closer_calls").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closer-calls"] });
      qc.invalidateQueries({ queryKey: ["closing-rates"] });
    },
  });
}
