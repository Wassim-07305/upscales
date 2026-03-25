"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { FinancialEntry, PaymentSchedule } from "@/lib/types/database";

function getSupabase() { return createClient(); }

export function useFinancialEntries(filters?: { clientId?: string; type?: string }) {
  return useQuery({
    queryKey: ["financial-entries", filters],
    queryFn: async () => {
      let query = getSupabase()
        .from("financial_entries")
        .select("*")
        .order("date", { ascending: false });

      if (filters?.clientId) query = query.eq("client_id", filters.clientId);
      if (filters?.type && filters.type !== "all") query = query.eq("type", filters.type);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FinancialEntry[];
    },
  });
}

export function useCreateFinancialEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Partial<FinancialEntry>) => {
      const { data, error } = await getSupabase().from("financial_entries").insert(entry).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial-entries"] }),
  });
}

export function useUpdateFinancialEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialEntry> & { id: string }) => {
      const { error } = await getSupabase().from("financial_entries").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial-entries"] }),
  });
}

export function useDeleteFinancialEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from("financial_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial-entries"] }),
  });
}

// ─── Payment Schedules ──────────────────────────────────

export function usePaymentSchedules(clientId?: string) {
  return useQuery({
    queryKey: ["payment-schedules", clientId],
    queryFn: async () => {
      let query = getSupabase()
        .from("payment_schedules")
        .select("*")
        .order("due_date", { ascending: true });
      if (clientId) query = query.eq("client_id", clientId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PaymentSchedule[];
    },
  });
}

export function useCreatePaymentSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (schedule: Partial<PaymentSchedule>) => {
      const { error } = await getSupabase().from("payment_schedules").insert(schedule);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-schedules"] }),
  });
}

export function useUpdatePaymentSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentSchedule> & { id: string }) => {
      const { error } = await getSupabase().from("payment_schedules").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-schedules"] }),
  });
}

// ─── Finance Stats ──────────────────────────────────────

export function useFinanceStats(clientId?: string) {
  return useQuery({
    queryKey: ["finance-stats", clientId],
    queryFn: async () => {
      let query = getSupabase().from("financial_entries").select("type, amount, is_paid");
      if (clientId) query = query.eq("client_id", clientId);
      const { data, error } = await query;
      if (error) throw error;

      const entries = data || [];
      const ca = entries.filter((e) => e.type === "ca" || e.type === "récurrent");
      const charges = entries.filter((e) => e.type === "charge" || e.type === "prestataire");

      return {
        total_ca: ca.reduce((s, e) => s + Number(e.amount), 0),
        total_charges: charges.reduce((s, e) => s + Number(e.amount), 0),
        ca_encaisse: ca.filter((e) => e.is_paid).reduce((s, e) => s + Number(e.amount), 0),
        margin: ca.reduce((s, e) => s + Number(e.amount), 0) - charges.reduce((s, e) => s + Number(e.amount), 0),
      };
    },
  });
}
