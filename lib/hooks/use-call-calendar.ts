"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CallCalendarEntry } from "@/lib/types/database";
import { toast } from "sonner";

function db() { return createClient(); }

interface CallFilters {
  clientId?: string;
  date?: string;
  assignedTo?: string;
  status?: string;
}

export function useCallCalendar(filters?: CallFilters) {
  return useQuery({
    queryKey: ["call-calendar", filters],
    queryFn: async () => {
      let query = db()
        .from("call_calendar")
        .select("*, client:clients(id, name), lead:leads(full_name), assignee:profiles!call_calendar_assigned_to_fkey(id, full_name, avatar_url)")
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (filters?.clientId) query = query.eq("client_id", filters.clientId);
      if (filters?.date) query = query.eq("date", filters.date);
      if (filters?.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
      if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CallCalendarEntry[];
    },
  });
}

export function useCallStats(filters?: CallFilters) {
  return useQuery({
    queryKey: ["call-stats", filters],
    queryFn: async () => {
      let query = db().from("call_calendar").select("status, date");
      if (filters?.clientId) query = query.eq("client_id", filters.clientId);
      if (filters?.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
      const { data, error } = await query;
      if (error) throw error;

      const calls = data || [];
      const today = new Date().toISOString().split("T")[0];
      return {
        total: calls.length,
        today: calls.filter((c) => c.date === today).length,
        upcoming: calls.filter((c) => c.date >= today && c.status === "planifié").length,
        realise: calls.filter((c) => c.status === "réalisé").length,
        no_show: calls.filter((c) => c.status === "no_show").length,
      };
    },
  });
}

export function useCreateCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (call: Partial<CallCalendarEntry>) => {
      const { data, error } = await db().from("call_calendar").insert(call).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["call-calendar"] });
      qc.invalidateQueries({ queryKey: ["call-stats"] });
      toast.success("Appel ajouté");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CallCalendarEntry> & { id: string }) => {
      const { error } = await db().from("call_calendar").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["call-calendar"] });
      qc.invalidateQueries({ queryKey: ["call-stats"] });
      toast.success("Appel mis à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from("call_calendar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["call-calendar"] });
      qc.invalidateQueries({ queryKey: ["call-stats"] });
      toast.success("Appel supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
