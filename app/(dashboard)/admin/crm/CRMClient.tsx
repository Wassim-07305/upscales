"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useAllClientAssignments,
  useClosingRates,
} from "@/lib/hooks/use-clients";
import { useLeads, useLeadStats } from "@/lib/hooks/use-crm-leads";
import { useFinanceStats } from "@/lib/hooks/use-finances";
import {
  usePipelineColumns,
  usePipelineLeads,
  useCreatePipelineLead,
  useUpdatePipelineLead,
  useDeletePipelineLead,
  useMovePipelineLead,
  usePipelineStats,
} from "@/lib/hooks/use-pipeline";
import type { Client, ClientStatus, Lead, PipelineColumn } from "@/lib/types/database";
import {
  CLIENT_STATUSES,
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_COLORS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_STAGE_COLORS,
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
} from "@/lib/constants/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DndContext,
  closestCorners,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  Phone,
  Mail,
  Building2,
  ExternalLink,
  Kanban,
  List,
  BarChart3,
  DollarSign,
  TrendingUp,
  Target,
  GripVertical,
  X,
  Calendar,
  Instagram,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/dates";

// ─── Types ───────────────────────────────────────────────

interface ClientFormState {
  name: string;
  email: string;
  phone: string;
  niche: string;
  notes: string;
  status: ClientStatus;
  business_manager: string;
}

const emptyClientForm: ClientFormState = {
  name: "",
  email: "",
  phone: "",
  niche: "",
  notes: "",
  status: "en_attente",
  business_manager: "",
};

interface LeadFormState {
  full_name: string;
  email: string;
  phone: string;
  instagram_url: string;
  source: string;
  client_id: string;
  ca_contracte: number;
  ca_collecte: number;
  date_relance: string;
  notes: string;
}

const emptyLeadForm: LeadFormState = {
  full_name: "",
  email: "",
  phone: "",
  instagram_url: "",
  source: "instagram",
  client_id: "",
  ca_contracte: 0,
  ca_collecte: 0,
  date_relance: "",
  notes: "",
};

// ─── Main Component ──────────────────────────────────────

type CRMTab = "liste" | "pipeline" | "bilan";

export function CRMClient() {
  const [activeTab, setActiveTab] = useState<CRMTab>("pipeline");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-muted-foreground text-sm">
            Gestion clients, pipeline et bilan
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        {([
          { value: "pipeline" as CRMTab, label: "Pipeline", icon: Kanban },
          { value: "liste" as CRMTab, label: "Clients", icon: List },
          { value: "bilan" as CRMTab, label: "Bilan", icon: BarChart3 },
        ]).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
              activeTab === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "pipeline" && <PipelineTab />}
      {activeTab === "liste" && <ClientListTab />}
      {activeTab === "bilan" && <BilanTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PIPELINE TAB — Vue Kanban globale
// ═══════════════════════════════════════════════════════════

function PipelineTab() {
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadFormState>(emptyLeadForm);
  const [selectedLead, setSelectedLead] = useState<(Lead & { client?: { id: string; name: string } | null }) | null>(null);
  const [editingLead, setEditingLead] = useState(false);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  // Data
  const { data: clients } = useClients();
  const pipelineFilters = useMemo(() => ({
    clientId: clientFilter !== "all" ? clientFilter : undefined,
  }), [clientFilter]);
  const { data: columns, isLoading: colsLoading } = usePipelineColumns();
  const { data: leads, isLoading: leadsLoading } = usePipelineLeads(
    clientFilter !== "all" ? { clientId: clientFilter } : undefined
  );
  const { data: stats } = usePipelineStats(
    clientFilter !== "all" ? { clientId: clientFilter } : undefined
  );

  // Mutations
  const createLead = useCreatePipelineLead();
  const updateLead = useUpdatePipelineLead();
  const deleteLead = useDeletePipelineLead();
  const moveLead = useMovePipelineLead();

  // Group leads by column
  const leadsByColumn = useMemo(() => {
    const map: Record<string, (Lead & { client?: { id: string; name: string } | null })[]> = {};
    if (columns) {
      for (const col of columns) map[col.id] = [];
    }
    for (const l of leads || []) {
      if (l.column_id && map[l.column_id]) {
        map[l.column_id].push(l);
      } else if (columns?.length) {
        // Lead sans colonne → première colonne
        const firstCol = columns[0];
        if (!map[firstCol.id]) map[firstCol.id] = [];
        map[firstCol.id].push(l);
      }
    }
    return map;
  }, [leads, columns]);

  // Drag handler
  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedLead(null);
    const { active, over } = event;
    if (!over) return;
    const colId = over.id as string;
    const leadId = active.id as string;
    const lead = leads?.find((l) => l.id === leadId);
    const col = columns?.find((c) => c.id === colId);
    if (!lead || !col || lead.column_id === colId) return;
    const effectiveClientId = lead.client_id || "00000000-0000-0000-0000-000000000000";
    moveLead.mutate({ leadId, columnId: colId, columnName: col.name, clientId: effectiveClientId });
  };

  // Add lead handler
  const handleAddLead = async () => {
    if (!leadForm.full_name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    const firstColumn = columns?.[0];
    try {
      await createLead.mutateAsync({
        full_name: leadForm.full_name.trim(),
        email: leadForm.email.trim() || null,
        phone: leadForm.phone.trim() || null,
        instagram_url: leadForm.instagram_url.trim() || null,
        source: leadForm.source || null,
        client_id: leadForm.client_id || null,
        column_id: firstColumn?.id || null,
        ca_contracte: leadForm.ca_contracte || 0,
        ca_collecte: leadForm.ca_collecte || 0,
        date_relance: leadForm.date_relance || null,
        notes: leadForm.notes.trim() || null,
        status: "nouveau",
        sort_order: 0,
      } as Partial<Lead>);
      toast.success("Lead ajouté");
      setLeadDialogOpen(false);
      setLeadForm(emptyLeadForm);
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  // Update lead handler
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
        client_id: leadForm.client_id || null,
        ca_contracte: leadForm.ca_contracte || 0,
        ca_collecte: leadForm.ca_collecte || 0,
        date_relance: leadForm.date_relance || null,
        notes: leadForm.notes.trim() || null,
      });
      toast.success("Lead mis à jour");
      setEditingLead(false);
      setSelectedLead(null);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const openLeadEditor = (lead: Lead & { client?: { id: string; name: string } | null }) => {
    setSelectedLead(lead);
    setLeadForm({
      full_name: lead.full_name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      instagram_url: lead.instagram_url || "",
      source: lead.source || "instagram",
      client_id: lead.client_id || "",
      ca_contracte: lead.ca_contracte || 0,
      ca_collecte: lead.ca_collecte || 0,
      date_relance: lead.date_relance || "",
      notes: lead.notes || "",
    });
    setEditingLead(false);
  };

  const isLoading = colsLoading || leadsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[130px]" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-[280px] flex-shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 items-center">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Tous les clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {clients?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => { setLeadForm(emptyLeadForm); setLeadDialogOpen(true); }}
            className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90"
            size="sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nouveau lead
          </Button>
        </div>
        {stats && (
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="text-muted-foreground">{stats.total} leads</span>
            <span className="text-muted-foreground">{stats.active} actifs</span>
            <span>
              Pipeline : <span className="text-[#C6FF00] font-semibold">{stats.pipeline_value.toLocaleString("fr-FR")} €</span>
            </span>
            {stats.relances_today > 0 && (
              <span className="text-red-400 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {stats.relances_today} relance{stats.relances_today > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={(e) => {
          const l = leads?.find((lead) => lead.id === e.active.id);
          setDraggedLead(l || null);
        }}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-6 md:px-6">
          {columns?.map((col) => {
            const colLeads = leadsByColumn[col.id] || [];
            return (
              <KanbanColumn
                key={col.id}
                column={col}
                leads={colLeads}
                onClickLead={openLeadEditor}
              />
            );
          })}
        </div>
        <DragOverlay>
          {draggedLead && <LeadCard lead={draggedLead} isDragOverlay />}
        </DragOverlay>
      </DndContext>

      {/* New Lead Dialog */}
      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Nouveau lead</DialogTitle>
          </DialogHeader>
          <LeadFormFields form={leadForm} setForm={setLeadForm} clients={clients || []} />
          <Button
            onClick={handleAddLead}
            disabled={createLead.isPending}
            className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90 mt-2"
          >
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
              <h3 className="font-semibold text-lg">{selectedLead.full_name}</h3>
              <div className="flex items-center gap-2">
                {!editingLead && (
                  <Button size="sm" variant="outline" onClick={() => setEditingLead(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Modifier
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedLead(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {editingLead ? (
                <>
                  <LeadFormFields form={leadForm} setForm={setLeadForm} clients={clients || []} />
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleUpdateLead} disabled={updateLead.isPending} className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90 flex-1">
                      {updateLead.isPending ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingLead(false)}>Annuler</Button>
                  </div>
                </>
              ) : (
                <LeadDetailView lead={selectedLead} />
              )}
              {!editingLead && (
                <div className="pt-4 border-t border-border">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (!confirm("Supprimer ce lead ?")) return;
                      deleteLead.mutate(selectedLead.id);
                      setSelectedLead(null);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Supprimer
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
// CLIENT LIST TAB
// ═══════════════════════════════════════════════════════════

function ClientListTab() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormState>(emptyClientForm);

  const clientFilters = useMemo(() => ({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  }), [search, statusFilter]);

  const { data: clients, isLoading } = useClients(clientFilters);
  const { data: allAssignments } = useAllClientAssignments();
  const { data: closingRates } = useClosingRates();

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const assignmentsByClient = useMemo(() => {
    const map: Record<string, { role: string; name: string }[]> = {};
    if (!allAssignments) return map;
    for (const a of allAssignments) {
      if (!map[a.client_id]) map[a.client_id] = [];
      map[a.client_id].push({ role: a.role, name: a.profile?.full_name || "—" });
    }
    return map;
  }, [allAssignments]);

  const totalClients = clients?.length ?? 0;
  const activeClients = clients?.filter((c) => c.status === "actif").length ?? 0;

  const openCreateDialog = () => {
    setEditingClient(null);
    setForm(emptyClientForm);
    setDialogOpen(true);
  };

  const openEditDialog = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
    setForm({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      niche: client.niche || "",
      notes: client.notes || "",
      status: client.status,
      business_manager: client.business_manager || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    const payload: Partial<Client> = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      niche: form.niche.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
      business_manager: form.business_manager.trim() || null,
    };
    try {
      if (editingClient) {
        await updateClient.mutateAsync({ id: editingClient.id, ...payload });
        toast.success("Client mis à jour");
      } else {
        await createClient.mutateAsync(payload);
        toast.success("Client créé");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Supprimer "${client.name}" ?`)) return;
    try {
      await deleteClient.mutateAsync(client.id);
      toast.success("Client supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#141414] border-0"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {CLIENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{CLIENT_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openCreateDialog} className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un client
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Total clients" value={totalClients} color="text-[#C6FF00]" bg="bg-[#C6FF00]/10" />
        <KPICard icon={Users} label="Actifs" value={activeClients} color="text-emerald-400" bg="bg-emerald-500/10" />
        <KPICard icon={Phone} label="Taux closing" value={`${getAvgClosingRate(closingRates)}%`} color="text-blue-400" bg="bg-blue-500/10" />
        <KPICard icon={Building2} label="CA pipeline" value={getTotalClosedCA(closingRates)} color="text-purple-400" bg="bg-purple-500/10" />
      </div>

      {/* Table */}
      {clients && clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C6FF00]/10 mb-4">
              <Users className="h-7 w-7 text-[#C6FF00]" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Aucun client</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {search || statusFilter !== "all" ? "Aucun résultat." : "Ajoutez votre premier client."}
            </p>
            {!search && statusFilter === "all" && (
              <Button onClick={openCreateDialog} className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Client</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Téléphone</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Niche</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Statut</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Manager</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Close rate</th>
                    <th className="p-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients?.map((client) => {
                    const rate = closingRates?.[client.id]?.rate ?? null;
                    const manager = assignmentsByClient[client.id]?.find((a) => a.role === "manager")?.name || "—";
                    return (
                      <tr
                        key={client.id}
                        onClick={() => router.push(`/admin/crm/${client.id}`)}
                        className="hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#C6FF00]/20 flex items-center justify-center text-xs font-medium text-[#C6FF00]">
                              {getInitials(client.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{client.name}</p>
                              {client.email && (
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  {client.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{client.phone || "—"}</span>
                        </td>
                        <td className="p-3 hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">{client.niche || "—"}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={cn("text-[10px]", CLIENT_STATUS_COLORS[client.status])}>
                            {CLIENT_STATUS_LABELS[client.status]}
                          </Badge>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{manager}</span>
                        </td>
                        <td className="p-3 hidden lg:table-cell">
                          {rate !== null ? (
                            <span className={cn("text-sm font-medium", rate >= 50 ? "text-emerald-400" : rate >= 25 ? "text-amber-400" : "text-red-400")}>
                              {rate}%
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => openEditDialog(client, e)} title="Modifier">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); router.push(`/admin/crm/${client.id}`); }} title="Détail">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={(e) => handleDelete(client, e)} title="Supprimer">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Modifier le client" : "Nouveau client"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nom *</Label>
              <Input placeholder="Nom du client" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-[#141414] border-0" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@exemple.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="bg-[#141414] border-0" />
              </div>
              <div className="grid gap-2">
                <Label>Téléphone</Label>
                <Input placeholder="+33 6 00 00 00 00" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="bg-[#141414] border-0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Niche</Label>
                <Input placeholder="Ex: coaching, e-commerce..." value={form.niche} onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))} className="bg-[#141414] border-0" />
              </div>
              <div className="grid gap-2">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ClientStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLIENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{CLIENT_STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input placeholder="Notes internes..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="bg-[#141414] border-0" />
            </div>
            <Button onClick={handleSubmit} disabled={createClient.isPending || updateClient.isPending} className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90 mt-2">
              {createClient.isPending || updateClient.isPending ? "Enregistrement..." : editingClient ? "Mettre à jour" : "Créer le client"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// BILAN TAB
// ═══════════════════════════════════════════════════════════

function BilanTab() {
  const emptyFilters = useMemo(() => ({}), []);
  const { data: allLeads } = useLeads(emptyFilters);
  const { data: leadStats } = useLeadStats();
  const { data: financeStats } = useFinanceStats();
  const { data: closingRates } = useClosingRates();
  const { data: clients } = useClients();

  const filteredLeads = allLeads || [];
  const leadsByStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of LEAD_STATUSES) map[s] = [];
    for (const l of filteredLeads) {
      if (map[l.status]) map[l.status].push(l);
    }
    return map;
  }, [filteredLeads]);

  const totalClients = clients?.length ?? 0;
  const activeClients = clients?.filter((c) => c.status === "actif").length ?? 0;
  const avgRate = getAvgClosingRate(closingRates);

  return (
    <>
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Target} label="Total leads" value={leadStats?.total || 0} color="text-[#C6FF00]" bg="bg-[#C6FF00]/10" />
        <KPICard icon={DollarSign} label="CA closé" value={`${(leadStats?.ca_close || 0).toLocaleString("fr-FR")} €`} color="text-emerald-400" bg="bg-emerald-500/10" />
        <KPICard icon={TrendingUp} label="Pipeline" value={`${(leadStats?.pipeline_value || 0).toLocaleString("fr-FR")} €`} color="text-blue-400" bg="bg-blue-500/10" />
        <KPICard icon={BarChart3} label="Marge nette" value={`${(financeStats?.margin || 0).toLocaleString("fr-FR")} €`} color="text-purple-400" bg="bg-purple-500/10" />
      </div>

      {/* Breakdown by status */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Répartition par statut</h3>
          <div className="space-y-3">
            {LEAD_STATUSES.map((status) => {
              const count = leadsByStatus[status]?.length || 0;
              const total = filteredLeads.length || 1;
              const pct = Math.round((count / total) * 100);
              const value = (leadsByStatus[status] || []).reduce((s, l) => s + (l.estimated_value || 0), 0);
              return (
                <div key={status} className="flex items-center gap-4">
                  <div className="w-28 text-sm font-medium">{LEAD_STATUS_LABELS[status]}</div>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: LEAD_STAGE_COLORS[status] }} />
                  </div>
                  <div className="w-10 text-right text-sm font-semibold">{count}</div>
                  <div className="w-24 text-right text-sm text-muted-foreground">{value.toLocaleString("fr-FR")} €</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Finance + Clients summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Revenus</h3>
            <div className="space-y-3">
              <SummaryRow label="CA total" value={`${(financeStats?.total_ca || 0).toLocaleString("fr-FR")} €`} valueClass="text-emerald-400" />
              <SummaryRow label="CA encaissé" value={`${(financeStats?.ca_encaisse || 0).toLocaleString("fr-FR")} €`} />
              <div className="border-t border-border pt-3" />
              <SummaryRow label="Charges totales" value={`${(financeStats?.total_charges || 0).toLocaleString("fr-FR")} €`} valueClass="text-red-400" />
              <SummaryRow label="Marge" value={`${(financeStats?.margin || 0).toLocaleString("fr-FR")} €`} valueClass={cn("font-bold", (financeStats?.margin || 0) >= 0 ? "text-emerald-400" : "text-red-400")} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Clients</h3>
            <div className="space-y-3">
              <SummaryRow label="Total clients" value={totalClients} />
              <SummaryRow label="Clients actifs" value={activeClients} valueClass="text-emerald-400" />
              <SummaryRow label="Taux closing moyen" value={`${avgRate}%`} />
              <SummaryRow label="Leads closés" value={leadStats?.close || 0} />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════

function KanbanColumn({
  column,
  leads,
  onClickLead,
}: {
  column: PipelineColumn;
  leads: (Lead & { client?: { id: string; name: string } | null })[];
  onClickLead: (lead: Lead & { client?: { id: string; name: string } | null }) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const relanceCount = leads.filter(
    (l) => l.date_relance && l.date_relance <= new Date().toISOString().split("T")[0]
  ).length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-[280px] rounded-xl border border-border bg-card/50 flex flex-col max-h-[calc(100vh-16rem)]",
        isOver && "ring-2 ring-[#C6FF00]/50 bg-[#C6FF00]/5"
      )}
    >
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: column.color }} />
          <span className="text-sm font-medium">{column.name}</span>
          <Badge variant="outline" className="text-[10px] h-5">{leads.length}</Badge>
        </div>
        {relanceCount > 0 && (
          <Badge className="bg-red-500/20 text-red-400 text-[10px] h-5 animate-pulse">
            {relanceCount} relance{relanceCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {leads.map((lead) => (
          <DraggableLeadCard key={lead.id} lead={lead} onClick={() => onClickLead(lead)} />
        ))}
        {leads.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">Aucun lead</div>
        )}
      </div>
    </div>
  );
}

function DraggableLeadCard({ lead, onClick }: { lead: Lead & { client?: { id: string; name: string } | null }; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div ref={setNodeRef} className={cn(isDragging && "opacity-40")}>
      <LeadCard lead={lead} dragHandleProps={{ ...attributes, ...listeners }} onClick={onClick} />
    </div>
  );
}

function LeadCard({
  lead,
  isDragOverlay,
  dragHandleProps,
  onClick,
}: {
  lead: Lead & { client?: { id: string; name: string } | null };
  isDragOverlay?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onClick?: () => void;
}) {
  const isOverdue = lead.date_relance && lead.date_relance <= new Date().toISOString().split("T")[0];
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border bg-card p-3 space-y-1.5 cursor-pointer hover:border-primary/30 transition-colors",
        isOverdue ? "border-red-500/50 bg-red-500/5" : "border-border",
        isDragOverlay && "shadow-xl ring-2 ring-[#C6FF00]/30"
      )}
    >
      <div className="flex items-center gap-2">
        <button {...(dragHandleProps || {})} className="cursor-grab active:cursor-grabbing text-muted-foreground" onClick={(e) => e.stopPropagation()}>
          <GripVertical className="h-4 w-4" />
        </button>
        <p className="text-sm font-medium truncate flex-1">{lead.full_name}</p>
        {isOverdue && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
      </div>

      {/* Client badge */}
      {lead.client?.name && (
        <p className="text-[10px] text-muted-foreground pl-6 flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          {lead.client.name}
        </p>
      )}

      {lead.email && <p className="text-[11px] text-muted-foreground truncate pl-6">{lead.email}</p>}

      <div className="flex items-center gap-2 pl-6 flex-wrap">
        {lead.source && (
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
            {LEAD_SOURCE_LABELS[lead.source] || lead.source}
          </Badge>
        )}
        {lead.phone && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Phone className="h-3 w-3" />{lead.phone}
          </span>
        )}
        {(lead.ca_contracte || 0) > 0 && (
          <span className={cn("text-[10px] font-semibold", (lead.ca_contracte || 0) >= 3000 ? "text-[#C6FF00]" : "text-muted-foreground")}>
            {(lead.ca_contracte || 0).toLocaleString("fr-FR")} €
          </span>
        )}
      </div>

      {lead.date_relance && (
        <p className={cn("text-[10px] pl-6 flex items-center gap-1", isOverdue ? "text-red-400 font-medium" : "text-muted-foreground")}>
          <Calendar className="h-3 w-3" />
          Relance : {formatDate(lead.date_relance)}
        </p>
      )}
    </div>
  );
}

function LeadFormFields({
  form,
  setForm,
  clients,
}: {
  form: LeadFormState;
  setForm: React.Dispatch<React.SetStateAction<LeadFormState>>;
  clients: Client[];
}) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label>Nom *</Label>
        <Input placeholder="Nom du prospect" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="bg-[#141414] border-0" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Email</Label>
          <Input type="email" placeholder="email@exemple.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="bg-[#141414] border-0" />
        </div>
        <div className="grid gap-2">
          <Label>Téléphone</Label>
          <Input placeholder="+33 6 00 00 00 00" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="bg-[#141414] border-0" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Instagram</Label>
          <Input placeholder="@handle" value={form.instagram_url} onChange={(e) => setForm((f) => ({ ...f, instagram_url: e.target.value }))} className="bg-[#141414] border-0" />
        </div>
        <div className="grid gap-2">
          <Label>Source</Label>
          <Select value={form.source} onValueChange={(v) => setForm((f) => ({ ...f, source: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Client</Label>
        <Select value={form.client_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v === "none" ? "" : v }))}>
          <SelectTrigger><SelectValue placeholder="Aucun client" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun client</SelectItem>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>CA contracté (€)</Label>
          <Input type="number" value={form.ca_contracte || ""} onChange={(e) => setForm((f) => ({ ...f, ca_contracte: Number(e.target.value) || 0 }))} className="bg-[#141414] border-0" />
        </div>
        <div className="grid gap-2">
          <Label>CA collecté (€)</Label>
          <Input type="number" value={form.ca_collecte || ""} onChange={(e) => setForm((f) => ({ ...f, ca_collecte: Number(e.target.value) || 0 }))} className="bg-[#141414] border-0" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Date de relance</Label>
        <Input type="date" value={form.date_relance} onChange={(e) => setForm((f) => ({ ...f, date_relance: e.target.value }))} className="bg-[#141414] border-0" />
      </div>
      <div className="grid gap-2">
        <Label>Notes</Label>
        <Input placeholder="Notes sur le prospect..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="bg-[#141414] border-0" />
      </div>
    </div>
  );
}

function LeadDetailView({ lead }: { lead: Lead & { client?: { id: string; name: string } | null } }) {
  const isOverdue = lead.date_relance && lead.date_relance <= new Date().toISOString().split("T")[0];
  return (
    <div className="space-y-3">
      {lead.client?.name && <DetailRow label="Client" value={lead.client.name} />}
      {lead.email && <DetailRow label="Email" value={lead.email} />}
      {lead.phone && <DetailRow label="Téléphone" value={lead.phone} />}
      {lead.instagram_url && <DetailRow label="Instagram" value={lead.instagram_url} />}
      {lead.source && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Source</span>
          <Badge variant="outline" className="text-[10px]">{LEAD_SOURCE_LABELS[lead.source] || lead.source}</Badge>
        </div>
      )}
      <div className="border-t border-border pt-3" />
      <DetailRow label="CA contracté" value={`${(lead.ca_contracte || 0).toLocaleString("fr-FR")} €`} valueClass="font-semibold" />
      <DetailRow label="CA collecté" value={`${(lead.ca_collecte || 0).toLocaleString("fr-FR")} €`} />
      {lead.date_relance && (
        <DetailRow label="Relance" value={formatDate(lead.date_relance)} valueClass={isOverdue ? "text-red-400 font-medium" : ""} />
      )}
      {lead.notes && (
        <div>
          <span className="text-sm text-muted-foreground">Notes</span>
          <p className="text-sm mt-1 whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{lead.notes}</p>
        </div>
      )}
      {lead.next_action && (
        <div>
          <span className="text-sm text-muted-foreground">Prochaine action</span>
          <p className="text-sm mt-1">{lead.next_action}</p>
        </div>
      )}
      <DetailRow label="Ajouté le" value={formatDate(lead.created_at)} />
    </div>
  );
}

// ─── Utility Components ──────────────────────────────────

function KPICard({ icon: Icon, label, value, color, bg }: { icon: React.ElementType; label: string; value: string | number; color: string; bg: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", bg)}>
            <Icon className={cn("h-5 w-5", color)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value, valueClass }: { label: string; value: string | number; valueClass?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm", valueClass)}>{value}</span>
    </div>
  );
}

function SummaryRow({ label, value, valueClass }: { label: string; value: string | number; valueClass?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", valueClass)}>{value}</span>
    </div>
  );
}

// ─── Helper functions ────────────────────────────────────

function getAvgClosingRate(closingRates: Record<string, { total: number; closed: number; rate: number }> | undefined): number {
  if (!closingRates) return 0;
  const rates = Object.values(closingRates).map((r) => r.rate);
  if (rates.length === 0) return 0;
  return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
}

function getTotalClosedCA(closingRates: Record<string, { total: number; closed: number; rate: number }> | undefined): string {
  if (!closingRates) return "0";
  const total = Object.values(closingRates).reduce((sum, r) => sum + r.closed, 0);
  return total.toLocaleString("fr-FR");
}
