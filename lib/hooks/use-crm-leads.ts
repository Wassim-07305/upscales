"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Lead } from "@/lib/types/database";

const supabase = createClient();

export function useLeads(filters?: { clientId?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: ["crm-leads", filters],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("updated_at", { ascending: false });

      if (filters?.clientId) query = query.eq("client_id", filters.clientId);
      if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return (data || []) as Lead[];
    },
  });
}

export function useLeadsByClient(clientId: string | null) {
  return useQuery({
    queryKey: ["crm-leads", { clientId }],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Lead[];
    },
    enabled: !!clientId,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      const { data, error } = await supabase.from("leads").insert(lead).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-leads"] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { error } = await supabase.from("leads").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-leads"] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-leads"] }),
  });
}

export function useLeadStats(clientId?: string) {
  return useQuery({
    queryKey: ["lead-stats", clientId],
    queryFn: async () => {
      let query = supabase.from("leads").select("status, estimated_value");
      if (clientId) query = query.eq("client_id", clientId);
      const { data, error } = await query;
      if (error) throw error;

      const leads = data || [];
      return {
        total: leads.length,
        nouveau: leads.filter((l) => l.status === "nouveau").length,
        qualifie: leads.filter((l) => l.status === "qualifie").length,
        appel_booke: leads.filter((l) => l.status === "appel_booke").length,
        close: leads.filter((l) => l.status === "close").length,
        perdu: leads.filter((l) => l.status === "perdu").length,
        pipeline_value: leads
          .filter((l) => !["perdu", "no_show"].includes(l.status))
          .reduce((sum, l) => sum + (l.estimated_value || 0), 0),
        ca_close: leads
          .filter((l) => l.status === "close")
          .reduce((sum, l) => sum + (l.estimated_value || 0), 0),
      };
    },
  });
}
