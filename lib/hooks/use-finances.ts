"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { FinancialEntry, PaymentSchedule } from "@/lib/types/database";
import { toast } from "sonner";

function db() { return createClient(); }

// ─── Financial Entries ──────────────────────────────────

interface FinanceFilters {
  clientId?: string;
  type?: string;
}

export function useFinancialEntries(filters?: FinanceFilters) {
  return useQuery({
    queryKey: ["financial-entries", filters],
    queryFn: async () => {
      let query = db()
        .from("financial_entries")
        .select("*, client:clients(id, name)")
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
      const { data, error } = await db().from("financial_entries").insert(entry).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial-entries"] });
      qc.invalidateQueries({ queryKey: ["finance-stats"] });
      toast.success("Entrée financière créée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateFinancialEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialEntry> & { id: string }) => {
      const { error } = await db().from("financial_entries").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial-entries"] });
      qc.invalidateQueries({ queryKey: ["finance-stats"] });
      toast.success("Entrée mise à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteFinancialEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from("financial_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial-entries"] });
      qc.invalidateQueries({ queryKey: ["finance-stats"] });
      toast.success("Entrée supprimée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Finance Stats ──────────────────────────────────────

export function useFinanceStats(clientId?: string) {
  return useQuery({
    queryKey: ["finance-stats", clientId],
    queryFn: async () => {
      let query = db().from("financial_entries").select("type, sub_type, amount, is_paid");
      if (clientId) query = query.eq("client_id", clientId);
      const { data, error } = await query;
      if (error) throw error;

      const entries = data || [];
      const caEntries = entries.filter((e) => e.type === "ca");
      const ca = caEntries.reduce((s, e) => s + Number(e.amount), 0);
      const new_cash = caEntries.filter((e) => e.sub_type === "new_cash").reduce((s, e) => s + Number(e.amount), 0);
      const mensualites = caEntries.filter((e) => e.sub_type === "mensualite").reduce((s, e) => s + Number(e.amount), 0);
      const recurrent = entries.filter((e) => e.type === "récurrent").reduce((s, e) => s + Number(e.amount), 0);
      const charges = entries.filter((e) => e.type === "charge").reduce((s, e) => s + Number(e.amount), 0);
      const prestataires = entries.filter((e) => e.type === "prestataire").reduce((s, e) => s + Number(e.amount), 0);
      const revenue = ca + recurrent;
      const expenses = charges + prestataires;
      const ca_encaisse = entries.filter((e) => (e.type === "ca" || e.type === "récurrent") && e.is_paid).reduce((s, e) => s + Number(e.amount), 0);

      return {
        ca,
        new_cash,
        mensualites,
        recurrent,
        charges,
        prestataires,
        revenue,
        expenses,
        ca_encaisse,
        margin: revenue - expenses,
        marge_pct: revenue > 0 ? Math.round(((revenue - expenses) / revenue) * 100) : 0,
      };
    },
  });
}

// ─── Payment Schedules ──────────────────────────────────

export function usePaymentSchedules(clientId?: string) {
  return useQuery({
    queryKey: ["payment-schedules", clientId],
    queryFn: async () => {
      let query = db()
        .from("payment_schedules")
        .select("*, client:clients(id, name)")
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
      const { data, error } = await db().from("payment_schedules").insert(schedule).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-schedules"] });
      toast.success("Échéance créée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePaymentSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentSchedule> & { id: string }) => {
      const { error } = await db().from("payment_schedules").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-schedules"] });
      toast.success("Échéance mise à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
