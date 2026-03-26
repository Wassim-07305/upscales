"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Lead } from "@/lib/types/database";
import { toast } from "sonner";

function db() { return createClient(); }

// ─── Leads with filters ─────────────────────────────────

interface LeadFilters {
  clientId?: string;
  status?: string;
  clientStatus?: string;
  source?: string;
  assignedTo?: string;
  search?: string;
}

export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ["leads", filters],
    queryFn: async () => {
      let query = db()
        .from("leads")
        .select("*, client:clients(id, name), assigned_profile:profiles!leads_assigned_to_fkey(id, full_name, avatar_url)")
        .order("sort_order", { ascending: true })
        .order("updated_at", { ascending: false })
        .limit(200);

      if (filters?.clientId) query = query.eq("client_id", filters.clientId);
      if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
      if (filters?.clientStatus && filters.clientStatus !== "all") query = query.eq("client_status", filters.clientStatus);
      if (filters?.source && filters.source !== "all") query = query.eq("source", filters.source);
      if (filters?.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Lead[];
    },
  });
}

export function useAllLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ["all-leads", filters],
    queryFn: async () => {
      let query = db()
        .from("leads")
        .select("*, client:clients(id, name)")
        .order("updated_at", { ascending: false })
        .limit(500);

      if (filters?.clientId) query = query.eq("client_id", filters.clientId);
      if (filters?.assignedTo) query = query.eq("assigned_to", filters.assignedTo);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Lead[];
    },
  });
}

export function useLeadsByClient(clientId: string | null) {
  return useQuery({
    queryKey: ["leads", { clientId }],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await db()
        .from("leads")
        .select("*, client:clients(id, name)")
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Lead[];
    },
    enabled: !!clientId,
  });
}

// ─── Mutations ──────────────────────────────────────────

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      const { data, error } = await db().from("leads").insert(lead).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["all-leads"] });
      qc.invalidateQueries({ queryKey: ["lead-stats"] });
      toast.success("Lead créé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { error } = await db().from("leads").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["all-leads"] });
      qc.invalidateQueries({ queryKey: ["lead-stats"] });
      toast.success("Lead mis à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["all-leads"] });
      qc.invalidateQueries({ queryKey: ["lead-stats"] });
      toast.success("Lead supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkCreateLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leads: Partial<Lead>[]) => {
      const batchSize = 100;
      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);
        const { error } = await db().from("leads").insert(batch);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["all-leads"] });
      qc.invalidateQueries({ queryKey: ["lead-stats"] });
      toast.success("Leads importés");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Lead Stats ─────────────────────────────────────────

export function useLeadStats(clientId?: string) {
  return useQuery({
    queryKey: ["lead-stats", clientId],
    queryFn: async () => {
      let query = db().from("leads").select("status, client_status, ca_contracte, ca_collecte, estimated_value, date_relance");
      if (clientId) query = query.eq("client_id", clientId);
      const { data, error } = await query;
      if (error) throw error;

      const leads = data || [];
      const today = new Date().toISOString().split("T")[0];
      return {
        total: leads.length,
        a_relancer: leads.filter((l) => l.status === "à_relancer").length,
        booke: leads.filter((l) => l.status === "booké").length,
        close: leads.filter((l) => l.client_status === "closé").length,
        perdu: leads.filter((l) => l.client_status === "perdu").length,
        ca_contracte: leads.reduce((s, l) => s + (Number(l.ca_contracte) || 0), 0),
        ca_collecte: leads.reduce((s, l) => s + (Number(l.ca_collecte) || 0), 0),
        pipeline_value: leads
          .filter((l) => l.client_status !== "perdu" && l.client_status !== "closé")
          .reduce((s, l) => s + (Number(l.ca_contracte) || 0), 0),
        relances_overdue: leads.filter((l) => l.date_relance && l.date_relance <= today && l.client_status !== "closé" && l.client_status !== "perdu").length,
      };
    },
  });
}
