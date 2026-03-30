"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { useAllLeads, useUpdateLead, useLeadStats, useCreateLead, useDeleteLead } from "@/lib/hooks/use-leads";
import { useFinanceStats } from "@/lib/hooks/use-finances";
import type { Lead, ClientScopeStatus } from "@/lib/types/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LEAD_SOURCES, LEAD_SOURCE_LABELS, LEAD_SOURCE_COLORS,
  CLIENT_SCOPE_STATUSES, CLIENT_SCOPE_STATUS_LABELS, CLIENT_SCOPE_STATUS_COLORS,
  LEAD_STATUS_LABELS, LEAD_STATUS_COLORS,
} from "@/lib/constants/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, closestCorners, DragOverlay, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import {
  Search, Plus, Pencil, Trash2, Users,
  Kanban, List, BarChart3, DollarSign, TrendingUp, Target, GripVertical, X,
  Calendar, AlertCircle, ExternalLink, UserCircle, ChevronDown, ChevronUp, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/dates";

// ─── Types ───────────────────────────────────────────────

interface LeadFormState {
  full_name: string; email: string; phone: string; instagram_url: string; source: string;
  ca_contracte: number; ca_collecte: number; nombre_paiements: number;
  date_relance: string; call_time: string; notes: string;
}
const emptyLeadForm: LeadFormState = {
  full_name: "", email: "", phone: "", instagram_url: "", source: "instagram",
  ca_contracte: 0, ca_collecte: 0, nombre_paiements: 1,
  date_relance: "", call_time: "", notes: "",
};

type CRMTab = "liste" | "pipeline" | "bilan";

// ─── Main Component ──────────────────────────────────────

export function CRMClient() {
  const [activeTab, setActiveTab] = useState<CRMTab>("liste");
  const [pipelineMemberFilter, setPipelineMemberFilter] = useState("all");

  const handleViewLeads = (memberId: string) => {
    setPipelineMemberFilter(memberId);
    setActiveTab("pipeline");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-muted-foreground text-sm">Membres, pipeline et bilan</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        {([
          { value: "liste" as CRMTab, label: "Liste", icon: List },
          { value: "pipeline" as CRMTab, label: "Pipeline", icon: Kanban },
          { value: "bilan" as CRMTab, label: "Bilan", icon: BarChart3 },
        ]).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
              activeTab === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "liste" && <MembresListView onViewLeads={handleViewLeads} />}
      {activeTab === "pipeline" && <PipelineTab memberFilter={pipelineMemberFilter} setMemberFilter={setPipelineMemberFilter} />}
      {activeTab === "bilan" && <BilanTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LISTE TAB — Platform users (member/prospect)
// ═══════════════════════════════════════════════════════════

function MembresListView({ onViewLeads }: { onViewLeads: (memberId: string) => void }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "prospect" | "member">("all");

  const { data: membres, isLoading } = useQuery({
    queryKey: ["crm-membres"],
    queryFn: async () => {
      const db = createSupabaseClient();
      const [{ data: profiles }, { data: leads }, { data: calls }] = await Promise.all([
        db.from("profiles").select("id, full_name, email, role, avatar_url, created_at").in("role", ["member", "prospect"]).order("created_at", { ascending: false }),
        db.from("leads").select("assigned_to"),
        db.from("closer_calls").select("closer_id, status, revenue"),
      ]);
      return (profiles || []).map((p) => {
        const userLeads = (leads || []).filter((l) => l.assigned_to === p.id);
        const userCalls = (calls || []).filter((c) => c.closer_id === p.id);
        const closedCalls = userCalls.filter((c) => c.status === "closé" || c.status === "paiement_reussi");
        return {
          ...p,
          leads_count: userLeads.length,
          calls_count: userCalls.length,
          ca_total: closedCalls.reduce((s, c) => s + (Number(c.revenue) || 0), 0),
          taux_closing: userCalls.length > 0 ? Math.round((closedCalls.length / userCalls.length) * 100) : null,
        };
      });
    },
  });

  const filtered = useMemo(() => {
    let list = membres || [];
    if (roleFilter !== "all") list = list.filter((m) => m.role === roleFilter);
    if (search) list = list.filter((m) =>
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [membres, roleFilter, search]);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-[400px] rounded-xl" /></div>;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-[#141414] border-0" />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="prospect">Prospects</SelectItem>
            <SelectItem value="member">Membres</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Total" value={filtered.length} color="text-[#C6FF00]" bg="bg-[#C6FF00]/10" />
        <KPICard icon={Target} label="Prospects" value={(membres || []).filter((m) => m.role === "prospect").length} color="text-amber-400" bg="bg-amber-500/10" />
        <KPICard icon={UserCircle} label="Membres" value={(membres || []).filter((m) => m.role === "member").length} color="text-turquoise" bg="bg-turquoise/10" />
        <KPICard icon={DollarSign} label="CA total" value={`${(membres || []).reduce((s, m) => s + m.ca_total, 0).toLocaleString("fr-FR")} €`} color="text-emerald-400" bg="bg-emerald-500/10" />
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <UserCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-sm">Aucun résultat</p>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-0"><div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-border">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Utilisateur</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Rôle</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Prospects</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Calls</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">CA</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Closing</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Inscrit le</th>
              <th className="p-3" />
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-accent/50 transition-colors">
                  <td className="p-3 cursor-pointer" onClick={() => router.push(`/admin/users/${m.id}`)}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={m.avatar_url || undefined} />
                        <AvatarFallback className="bg-[#C6FF00]/20 text-[#C6FF00] text-xs">{getInitials(m.full_name || m.email || "")}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={cn("text-[10px]", m.role === "prospect" ? "text-amber-400 border-amber-400/30 bg-amber-400/10" : "text-turquoise border-turquoise/30 bg-turquoise/10")}>
                      {m.role === "prospect" ? "Prospect" : "Membre"}
                    </Badge>
                  </td>
                  <td className="p-3 hidden md:table-cell"><span className="text-sm">{m.leads_count}</span></td>
                  <td className="p-3 hidden lg:table-cell"><span className="text-sm">{m.calls_count}</span></td>
                  <td className="p-3 hidden lg:table-cell"><span className="text-sm text-emerald-400">{m.ca_total > 0 ? `${m.ca_total.toLocaleString("fr-FR")} €` : "—"}</span></td>
                  <td className="p-3 hidden lg:table-cell">
                    {m.taux_closing !== null ? <span className={cn("text-sm font-medium", m.taux_closing >= 50 ? "text-emerald-400" : m.taux_closing >= 25 ? "text-amber-400" : "text-red-400")}>{m.taux_closing}%</span> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3 hidden md:table-cell"><span className="text-xs text-muted-foreground">{m.created_at ? formatDate(m.created_at) : "—"}</span></td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-[#C6FF00] hover:text-[#C6FF00] hover:bg-[#C6FF00]/10" onClick={() => onViewLeads(m.id)}>
                        Leads <ArrowRight className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.push(`/admin/users/${m.id}`)}>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></CardContent></Card>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// PIPELINE TAB — Kanban by client_status
// ═══════════════════════════════════════════════════════════

function PipelineTab({ memberFilter, setMemberFilter }: { memberFilter: string; setMemberFilter: (v: string) => void }) {
  const [prospectsOpen, setProspectsOpen] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadFormState>(emptyLeadForm);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const { data: membres } = useQuery({
    queryKey: ["crm-membres-list"],
    queryFn: async () => {
      const { data } = await createSupabaseClient().from("profiles").select("id, full_name, email").in("role", ["member", "prospect"]).order("full_name");
      return data || [];
    },
  });

  const { data: platformProspects } = useQuery({
    queryKey: ["crm-platform-prospects"],
    queryFn: async () => {
      const { data } = await createSupabaseClient().from("profiles").select("id, full_name, email, avatar_url, created_at").eq("role", "prospect").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const leadsFilters = useMemo(() => (memberFilter !== "all" ? { assignedTo: memberFilter } : {}), [memberFilter]);
  const { data: leads, isLoading } = useAllLeads(leadsFilters);
  const { data: stats } = useLeadStats();
  const updateLead = useUpdateLead();
  const createLead = useCreateLead();
  const deleteLead = useDeleteLead();

  // Group leads by client_status
  const leadsByStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of CLIENT_SCOPE_STATUSES) map[s] = [];
    for (const l of leads || []) {
      if (map[l.client_status]) map[l.client_status].push(l);
    }
    return map;
  }, [leads]);

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedLead(null);
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as ClientScopeStatus;
    const leadId = active.id as string;
    const lead = leads?.find((l) => l.id === leadId);
    if (!lead || lead.client_status === newStatus) return;
    updateLead.mutate({ id: leadId, client_status: newStatus });
  };

  const handleAddLead = async () => {
    if (!leadForm.full_name.trim()) { toast.error("Le nom est obligatoire"); return; }
    try {
      await createLead.mutateAsync({
        full_name: leadForm.full_name.trim(),
        email: leadForm.email.trim() || null,
        phone: leadForm.phone.trim() || null,
        instagram_url: leadForm.instagram_url.trim() || null,
        source: leadForm.source || null,
        ca_contracte: leadForm.ca_contracte || 0,
        ca_collecte: leadForm.ca_collecte || 0,
        nombre_paiements: leadForm.nombre_paiements || 1,
        date_relance: leadForm.date_relance || null,
        call_time: leadForm.call_time || null,
        notes: leadForm.notes.trim() || null,
        client_status: "contacté",
        status: "à_relancer",
      } as Partial<Lead>);
      setLeadDialogOpen(false);
      setLeadForm(emptyLeadForm);
    } catch { /* toast handled */ }
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    try {
      await updateLead.mutateAsync({
        id: selectedLead.id,
        full_name: leadForm.full_name.trim(),
        email: leadForm.email.trim() || null,
        phone: leadForm.phone.trim() || null,
        instagram_url: leadForm.instagram_url.trim() || null,
        source: leadForm.source || null,
        ca_contracte: leadForm.ca_contracte || 0,
        ca_collecte: leadForm.ca_collecte || 0,
        nombre_paiements: leadForm.nombre_paiements || 1,
        date_relance: leadForm.date_relance || null,
        call_time: leadForm.call_time || null,
        notes: leadForm.notes.trim() || null,
      });
      setEditingLead(false);
      setSelectedLead(null);
    } catch { /* toast handled */ }
  };

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadForm({
      full_name: lead.full_name, email: lead.email || "", phone: lead.phone || "",
      instagram_url: lead.instagram_url || "", source: lead.source || "instagram",
      ca_contracte: lead.ca_contracte || 0,
      ca_collecte: lead.ca_collecte || 0, nombre_paiements: lead.nombre_paiements || 1,
      date_relance: lead.date_relance || "", call_time: lead.call_time || "", notes: lead.notes || "",
    });
    setEditingLead(false);
  };

  if (isLoading) return <div className="flex gap-3 overflow-hidden">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[500px] w-[280px] flex-shrink-0 rounded-xl" />)}</div>;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 items-center flex-wrap">
          <Select value={memberFilter} onValueChange={setMemberFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Tous les membres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les membres</SelectItem>
              {membres?.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { setLeadForm(emptyLeadForm); setLeadDialogOpen(true); }} className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90" size="sm">
            <Plus className="mr-1.5 h-4 w-4" />Nouveau lead
          </Button>
        </div>
        {stats && (
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="text-muted-foreground">{stats.total} leads</span>
            <span>CA contracté : <span className="text-[#C6FF00] font-semibold">{stats.ca_contracte.toLocaleString("fr-FR")} €</span></span>
            <span>Pipeline : <span className="text-blue-400 font-semibold">{stats.pipeline_value.toLocaleString("fr-FR")} €</span></span>
            {stats.relances_overdue > 0 && <span className="text-red-400 font-medium flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{stats.relances_overdue} relance{stats.relances_overdue > 1 ? "s" : ""}</span>}
          </div>
        )}
      </div>

      {/* Prospects plateforme */}
      {(platformProspects || []).length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5">
          <button
            onClick={() => setProspectsOpen((o) => !o)}
            className="w-full flex items-center justify-between p-3 text-sm font-medium text-amber-400"
          >
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Nouveaux prospects plateforme
              <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-400/30 bg-amber-400/10">{platformProspects?.length}</Badge>
            </div>
            {prospectsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {prospectsOpen && (
            <div className="flex gap-2 overflow-x-auto pb-3 px-3">
              {platformProspects?.map((p) => (
                <a key={p.id} href={`/admin/users/${p.id}`} className="flex-shrink-0 w-[180px] rounded-lg border border-border bg-card p-3 hover:border-amber-400/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px] bg-amber-400/20 text-amber-400">{getInitials(p.full_name || p.email || "")}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-medium truncate flex-1">{p.full_name || "—"}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>
                  {p.created_at && <p className="text-[10px] text-muted-foreground mt-1">{formatDate(p.created_at)}</p>}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <DndContext collisionDetection={closestCorners} onDragStart={(e) => { setDraggedLead(leads?.find((l) => l.id === e.active.id) || null); }} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-6 md:px-6">
          {CLIENT_SCOPE_STATUSES.map((status) => (
            <PipelineColumnView key={status} status={status} leads={leadsByStatus[status] || []} onClickLead={openLeadDetail} />
          ))}
        </div>
        <DragOverlay>{draggedLead && <PipelineCard lead={draggedLead} isDragOverlay />}</DragOverlay>
      </DndContext>

      {/* New Lead Dialog */}
      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>Nouveau lead</DialogTitle></DialogHeader>
          <LeadFormFields form={leadForm} setForm={setLeadForm} />
          <Button onClick={handleAddLead} disabled={createLead.isPending} className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90 mt-2">
            {createLead.isPending ? "Ajout..." : "Ajouter le lead"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedLead(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-semibold text-lg">{selectedLead.full_name}</h3>
                <Badge variant="outline" className={cn("text-[10px] mt-1", LEAD_STATUS_COLORS[selectedLead.status])}>{LEAD_STATUS_LABELS[selectedLead.status]}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {!editingLead && <Button size="sm" variant="outline" onClick={() => setEditingLead(true)}><Pencil className="h-3.5 w-3.5 mr-1" />Modifier</Button>}
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedLead(null)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {editingLead ? (
                <>
                  <LeadFormFields form={leadForm} setForm={setLeadForm} />
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleUpdateLead} disabled={updateLead.isPending} className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90 flex-1">{updateLead.isPending ? "Enregistrement..." : "Enregistrer"}</Button>
                    <Button variant="outline" onClick={() => setEditingLead(false)}>Annuler</Button>
                  </div>
                </>
              ) : (
                <LeadDetailView lead={selectedLead} />
              )}
              {!editingLead && (
                <div className="pt-4 border-t border-border">
                  <Button size="sm" variant="destructive" onClick={() => { if (!confirm("Supprimer ce lead ?")) return; deleteLead.mutate(selectedLead.id); setSelectedLead(null); }}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />Supprimer
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// BILAN TAB
// ═══════════════════════════════════════════════════════════

function BilanTab() {
  const { data: stats } = useLeadStats();
  const { data: financeStats } = useFinanceStats();

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Target} label="Total leads" value={stats?.total || 0} color="text-[#C6FF00]" bg="bg-[#C6FF00]/10" />
        <KPICard icon={DollarSign} label="CA contracté" value={`${(stats?.ca_contracte || 0).toLocaleString("fr-FR")} €`} color="text-emerald-400" bg="bg-emerald-500/10" />
        <KPICard icon={TrendingUp} label="Pipeline" value={`${(stats?.pipeline_value || 0).toLocaleString("fr-FR")} €`} color="text-blue-400" bg="bg-blue-500/10" />
        <KPICard icon={BarChart3} label="Marge" value={`${(financeStats?.margin || 0).toLocaleString("fr-FR")} €`} color="text-purple-400" bg="bg-purple-500/10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-6">
          <h3 className="font-semibold mb-4">Revenus</h3>
          <div className="space-y-3">
            <SRow label="CA total" value={`${(financeStats?.revenue || 0).toLocaleString("fr-FR")} €`} vc="text-emerald-400" />
            <SRow label="New Cash" value={`${(financeStats?.new_cash || 0).toLocaleString("fr-FR")} €`} />
            <SRow label="Mensualités" value={`${(financeStats?.mensualites || 0).toLocaleString("fr-FR")} €`} />
            <SRow label="Récurrent" value={`${(financeStats?.recurrent || 0).toLocaleString("fr-FR")} €`} vc="text-blue-400" />
            <SRow label="CA encaissé" value={`${(financeStats?.ca_encaisse || 0).toLocaleString("fr-FR")} €`} />
            <div className="border-t border-border pt-3" />
            <SRow label="Charges" value={`${(financeStats?.charges || 0).toLocaleString("fr-FR")} €`} vc="text-red-400" />
            <SRow label="Prestataires" value={`${(financeStats?.prestataires || 0).toLocaleString("fr-FR")} €`} vc="text-orange-400" />
            <div className="border-t border-border pt-3" />
            <SRow label="Marge" value={`${(financeStats?.margin || 0).toLocaleString("fr-FR")} €`} vc={cn("font-bold", (financeStats?.margin || 0) >= 0 ? "text-emerald-400" : "text-red-400")} />
            <SRow label="% Marge" value={`${financeStats?.marge_pct || 0}%`} />
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6">
          <h3 className="font-semibold mb-4">Leads</h3>
          <div className="space-y-3">
            <SRow label="Total leads" value={stats?.total || 0} />
            <SRow label="À relancer" value={stats?.a_relancer || 0} vc="text-amber-400" />
            <SRow label="Bookés" value={stats?.booke || 0} vc="text-blue-400" />
            <SRow label="Closés" value={stats?.close || 0} vc="text-emerald-400" />
            <SRow label="Perdus" value={stats?.perdu || 0} vc="text-red-400" />
          </div>
        </CardContent></Card>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════

function PipelineColumnView({ status, leads, onClickLead }: { status: ClientScopeStatus; leads: Lead[]; onClickLead: (l: Lead) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const totalCA = leads.reduce((s, l) => s + (l.ca_contracte || 0), 0);

  return (
    <div ref={setNodeRef} className={cn("flex-shrink-0 w-[280px] rounded-xl border border-border bg-card/50 flex flex-col max-h-[calc(100vh-16rem)] border-t-4", CLIENT_SCOPE_STATUS_COLORS[status], isOver && "ring-2 ring-[#C6FF00]/50 bg-[#C6FF00]/5")}>
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{CLIENT_SCOPE_STATUS_LABELS[status]}</span>
            <Badge variant="outline" className="text-[10px] h-5">{leads.length}</Badge>
          </div>
          {totalCA > 0 && <span className="text-[10px] text-muted-foreground font-medium">{totalCA.toLocaleString("fr-FR")} €</span>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {leads.map((lead) => <DraggablePipelineCard key={lead.id} lead={lead} onClick={() => onClickLead(lead)} />)}
        {leads.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground">Aucun lead</div>}
      </div>
    </div>
  );
}

function DraggablePipelineCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return <div ref={setNodeRef} className={cn(isDragging && "opacity-40")}><PipelineCard lead={lead} dragHandleProps={{ ...attributes, ...listeners }} onClick={onClick} /></div>;
}

function PipelineCard({ lead, isDragOverlay, dragHandleProps, onClick }: { lead: Lead; isDragOverlay?: boolean; dragHandleProps?: Record<string, unknown>; onClick?: () => void }) {
  const isOverdue = lead.date_relance && lead.date_relance <= new Date().toISOString().split("T")[0];
  const isStale = !isOverdue && lead.client_status === "qualifié" && lead.updated_at && (Date.now() - new Date(lead.updated_at).getTime() > 72 * 60 * 60 * 1000);

  return (
    <div onClick={onClick} className={cn(
      "rounded-lg border bg-card p-3 space-y-1.5 cursor-pointer hover:border-primary/30 transition-colors",
      isOverdue || isStale ? "border-red-500/50 bg-red-500/5" : "border-border",
      isDragOverlay && "shadow-xl ring-2 ring-[#C6FF00]/30 rotate-2"
    )}>
      <div className="flex items-center gap-2">
        <button {...(dragHandleProps || {})} className="cursor-grab active:cursor-grabbing text-muted-foreground" onClick={(e) => e.stopPropagation()}><GripVertical className="h-4 w-4" /></button>
        <p className="text-sm font-medium truncate flex-1">{lead.full_name}</p>
        {(isOverdue || isStale) && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
      </div>
      <div className="flex items-center gap-2 pl-6 flex-wrap">
        {lead.source && <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 border-0", LEAD_SOURCE_COLORS[lead.source])}>{LEAD_SOURCE_LABELS[lead.source] || lead.source}</Badge>}
        {(lead.ca_contracte || 0) > 0 && <span className={cn("text-[10px] font-semibold", lead.ca_contracte >= 3000 ? "text-[#C6FF00]" : "text-muted-foreground")}>{lead.ca_contracte.toLocaleString("fr-FR")} €</span>}
      </div>
      {lead.date_relance && <p className={cn("text-[10px] pl-6 flex items-center gap-1", isOverdue ? "text-red-400 font-medium" : "text-muted-foreground")}><Calendar className="h-3 w-3" />Relance : {formatDate(lead.date_relance)}</p>}
      {isStale && !isOverdue && <p className="text-[10px] pl-6 text-red-400 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" />À relancer</p>}
    </div>
  );
}

function LeadFormFields({ form, setForm }: { form: LeadFormState; setForm: React.Dispatch<React.SetStateAction<LeadFormState>> }) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2"><Label>Nom *</Label><Input placeholder="Nom du prospect" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="bg-[#141414] border-0" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2"><Label>Email</Label><Input type="email" placeholder="email@exemple.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="bg-[#141414] border-0" /></div>
        <div className="grid gap-2"><Label>Téléphone</Label><Input placeholder="+33 6 00 00 00 00" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="bg-[#141414] border-0" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2"><Label>Instagram</Label><Input placeholder="@handle" value={form.instagram_url} onChange={(e) => setForm((f) => ({ ...f, instagram_url: e.target.value }))} className="bg-[#141414] border-0" /></div>
        <div className="grid gap-2"><Label>Source</Label>
          <Select value={form.source} onValueChange={(v) => setForm((f) => ({ ...f, source: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2"><Label>Créneau appel</Label><Input placeholder="14h-15h" value={form.call_time} onChange={(e) => setForm((f) => ({ ...f, call_time: e.target.value }))} className="bg-[#141414] border-0" /></div>
        <div className="grid gap-2"><Label>Date de relance</Label><Input type="date" value={form.date_relance} onChange={(e) => setForm((f) => ({ ...f, date_relance: e.target.value }))} className="bg-[#141414] border-0" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2"><Label>CA contracté (€)</Label><Input type="number" value={form.ca_contracte || ""} onChange={(e) => setForm((f) => ({ ...f, ca_contracte: Number(e.target.value) || 0 }))} className="bg-[#141414] border-0" /></div>
        <div className="grid gap-2"><Label>CA collecté (€)</Label><Input type="number" value={form.ca_collecte || ""} onChange={(e) => setForm((f) => ({ ...f, ca_collecte: Number(e.target.value) || 0 }))} className="bg-[#141414] border-0" /></div>
        <div className="grid gap-2"><Label>Nb paiements</Label><Input type="number" value={form.nombre_paiements || ""} onChange={(e) => setForm((f) => ({ ...f, nombre_paiements: Number(e.target.value) || 1 }))} className="bg-[#141414] border-0" /></div>
      </div>
      <div className="grid gap-2"><Label>Notes</Label><Input placeholder="Notes..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="bg-[#141414] border-0" /></div>
    </div>
  );
}

function LeadDetailView({ lead }: { lead: Lead }) {
  const isOverdue = lead.date_relance && lead.date_relance <= new Date().toISOString().split("T")[0];
  return (
    <div className="space-y-3">
      {lead.email && <DRow label="Email" value={lead.email} />}
      {lead.phone && <DRow label="Téléphone" value={lead.phone} />}
      {lead.instagram_url && <DRow label="Instagram" value={lead.instagram_url} />}
      {lead.source && <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Source</span><Badge variant="outline" className={cn("text-[10px] border-0", LEAD_SOURCE_COLORS[lead.source])}>{LEAD_SOURCE_LABELS[lead.source] || lead.source}</Badge></div>}
      {lead.call_time && <DRow label="Créneau appel" value={lead.call_time} />}
      <div className="border-t border-border pt-3" />
      <DRow label="Statut pipeline" value={CLIENT_SCOPE_STATUS_LABELS[lead.client_status]} />
      <DRow label="CA contracté" value={`${(lead.ca_contracte || 0).toLocaleString("fr-FR")} €`} vc="font-semibold" />
      <DRow label="CA collecté" value={`${(lead.ca_collecte || 0).toLocaleString("fr-FR")} €`} />
      {lead.nombre_paiements > 1 && <DRow label="Paiements" value={`${lead.nombre_paiements}x ${Math.round(lead.ca_contracte / lead.nombre_paiements).toLocaleString("fr-FR")} €`} />}
      {lead.date_relance && <DRow label="Relance" value={formatDate(lead.date_relance)} vc={isOverdue ? "text-red-400 font-medium" : ""} />}
      {lead.notes && <div><span className="text-sm text-muted-foreground">Notes</span><p className="text-sm mt-1 whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{lead.notes}</p></div>}
      <DRow label="Ajouté le" value={formatDate(lead.created_at)} />
    </div>
  );
}

// ─── Utility Components ──────────────────────────────────

function KPICard({ icon: Icon, label, value, color, bg }: { icon: React.ElementType; label: string; value: string | number; color: string; bg: string }) {
  return <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", bg)}><Icon className={cn("h-5 w-5", color)} /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div></div></CardContent></Card>;
}

function DRow({ label, value, vc }: { label: string; value: string | number; vc?: string }) {
  return <div className="flex justify-between"><span className="text-sm text-muted-foreground">{label}</span><span className={cn("text-sm", vc)}>{value}</span></div>;
}

function SRow({ label, value, vc }: { label: string; value: string | number; vc?: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className={cn("font-semibold", vc)}>{value}</span></div>;
}
