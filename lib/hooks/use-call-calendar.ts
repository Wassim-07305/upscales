"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CallCalendarEntry } from "@/lib/types/database";

function getSupabase() { return createClient(); }

export function useCallCalendar(filters?: { clientId?: string; date?: string; assignedTo?: string }) {
  return useQuery({
    queryKey: ["call-calendar", filters],
    queryFn: async () => {
      let query = getSupabase()
        .from("call_calendar")
        .select("*, lead:leads(full_name), assignee:profiles!call_calendar_assigned_to_fkey(id, full_name, avatar_url)")
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (filters?.clientId) query = query.eq("client_id", filters.clientId);
      if (filters?.date) query = query.eq("date", filters.date);
      if (filters?.assignedTo) query = query.eq("assigned_to", filters.assignedTo);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CallCalendarEntry[];
    },
  });
}

export function useCreateCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (call: Partial<CallCalendarEntry>) => {
      const { data, error } = await getSupabase().from("call_calendar").insert(call).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["call-calendar"] }),
  });
}

export function useUpdateCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CallCalendarEntry> & { id: string }) => {
      const { error } = await getSupabase().from("call_calendar").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["call-calendar"] }),
  });
}

export function useDeleteCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from("call_calendar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["call-calendar"] }),
  });
}
