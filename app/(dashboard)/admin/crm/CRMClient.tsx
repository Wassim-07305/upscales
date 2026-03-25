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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DndContext,

  closestCorners,
  DragOverlay,
  useDraggable,
  useDroppable,
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

const emptyForm: ClientFormState = {
  name: "",
  email: "",
  phone: "",
  niche: "",
  notes: "",
  status: "en_attente",
  business_manager: "",
};


// ─── Component ───────────────────────────────────────────

type CRMTab = "liste" | "pipeline" | "bilan";

export function CRMClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CRMTab>("liste");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormState>(emptyForm);

  // Queries — memoize filter objects to avoid infinite re-renders
  const clientFilters = useMemo(() => ({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  }), [search, statusFilter]);
  const leadFilters = useMemo(() => ({}), []);

  const { data: clients, isLoading } = useClients(clientFilters);
  const { data: allAssignments } = useAllClientAssignments();
  const { data: closingRates } = useClosingRates();

  // Mutations
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  // Bilan queries
  const { data: allLeads } = useLeads(leadFilters);
  const { data: leadStats } = useLeadStats();
  const { data: financeStats } = useFinanceStats();

  // Pipeline state
  const [pipelineClientId, setPipelineClientId] = useState<string | null>(null);
  const { data: pipelineColumns } = usePipelineColumns(pipelineClientId);
  const { data: pipelineLeads } = usePipelineLeads(pipelineClientId);
  const { data: pipelineStats } = usePipelineStats(pipelineClientId);
  const createPipelineLead = useCreatePipelineLead();
  const updatePipelineLead = useUpdatePipelineLead();
  const deletePipelineLead = useDeletePipelineLead();
  const movePipelineLead = useMovePipelineLead();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [quickAddName, setQuickAddName] = useState("");

  // ─── Derived data ────────────────────────────────────

  const assignmentsByClient = useMemo(() => {
    const map: Record<string, { role: string; name: string }[]> = {};
    if (!allAssignments) return map;
    for (const a of allAssignments) {
      if (!map[a.client_id]) map[a.client_id] = [];
      map[a.client_id].push({
        role: a.role,
        name: a.profile?.full_name || "—",
      });
    }
    return map;
  }, [allAssignments]);

  const managerFor = (clientId: string): string => {
    const assignments = assignmentsByClient[clientId];
    if (!assignments) return "—";
    const manager = assignments.find((a) => a.role === "manager");
    return manager?.name || "—";
  };

  const closeRateFor = (clientId: string): number | null => {
    if (!closingRates || !closingRates[clientId]) return null;
    return closingRates[clientId].rate;
  };

  // ─── KPIs ────────────────────────────────────────────

  const totalClients = clients?.length ?? 0;
  const activeClients = clients?.filter((c) => c.status === "actif").length ?? 0;

  const avgClosingRate = useMemo(() => {
    if (!closingRates) return 0;
    const rates = Object.values(closingRates).map((r) => r.rate);
    if (rates.length === 0) return 0;
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  }, [closingRates]);

  const pipelineCA = useMemo(() => {
    if (!closingRates) return 0;
    return Object.values(closingRates).reduce((sum, r) => sum + r.closed, 0);
  }, [closingRates]);

  // ─── Form handlers ──────────────────────────────────

  const openCreateDialog = () => {
    setEditingClient(null);
    setForm(emptyForm);
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
      setEditingClient(null);
      setForm(emptyForm);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error("Erreur", { description: message });
    }
  };

  const handleDelete = async (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Supprimer le client "${client.name}" ?`)) return;
    try {
      await deleteClient.mutateAsync(client.id);
      toast.success("Client supprimé");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error("Erreur", { description: message });
    }
  };

  const handleRowClick = (clientId: string) => {
    router.push(`/admin/crm/${clientId}`);
  };

  // ─── Pipeline helpers (MUST be before any early return) ──

  // Auto-select first client for pipeline
  const effectiveClientId = pipelineClientId || clients?.[0]?.id || null;
  if (!pipelineClientId && clients?.length && clients[0].id !== pipelineClientId) {
    // Will trigger on next render
  }

  // Leads grouped by column for kanban
  const leadsByColumn = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    if (pipelineColumns) {
      for (const col of pipelineColumns) map[col.id] = [];
    }
    for (const l of pipelineLeads || []) {
      if (l.column_id && map[l.column_id]) {
        map[l.column_id].push(l);
      }
    }
    return map;
  }, [pipelineLeads, pipelineColumns]);

  // Leads grouped for bilan
  const filteredLeads = allLeads || [];
  const leadsByStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of LEAD_STATUSES) map[s] = [];
    for (const l of filteredLeads) {
      if (map[l.status]) map[l.status].push(l);
    }
    return map;
  }, [filteredLeads]);

  // ─── Loading skeleton ───────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="space-y-0 divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-muted-foreground">
            Gestion clients, pipeline et bilan
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Modifier le client" : "Nouveau client"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="client-name">Nom *</Label>
                <Input
                  id="client-name"
                  placeholder="Nom du client"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="bg-[#141414] border-0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="client-email">Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    placeholder="email@exemple.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="bg-[#141414] border-0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="client-phone">Téléphone</Label>
                  <Input
                    id="client-phone"
                    placeholder="+33 6 00 00 00 00"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="bg-[#141414] border-0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="client-niche">Niche</Label>
                  <Input
                    id="client-niche"
                    placeholder="Ex: coaching, e-commerce..."
                    value={form.niche}
                    onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
                    className="bg-[#141414] border-0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="client-status">Statut</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v as ClientStatus }))}
                  >
                    <SelectTrigger id="client-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {CLIENT_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client-manager">Business Manager</Label>
                <Input
                  id="client-manager"
                  placeholder="Nom du manager"
                  value={form.business_manager}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, business_manager: e.target.value }))
                  }
                  className="bg-[#141414] border-0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client-notes">Notes</Label>
                <Input
                  id="client-notes"
                  placeholder="Notes internes..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="bg-[#141414] border-0"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createClient.isPending || updateClient.isPending}
                className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90 mt-2"
              >
                {createClient.isPending || updateClient.isPending
                  ? "Enregistrement..."
                  : editingClient
                    ? "Mettre à jour"
                    : "Créer le client"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
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

      {/* ═══════════════ LISTE TAB ═══════════════ */}
      {activeTab === "liste" && <>

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
              <SelectItem key={s} value={s}>
                {CLIENT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C6FF00]/10">
                <Users className="h-5 w-5 text-[#C6FF00]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total clients</p>
                <p className="text-2xl font-bold">{totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clients actifs</p>
                <p className="text-2xl font-bold">{activeClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Phone className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taux closing moyen</p>
                <p className="text-2xl font-bold">{avgClosingRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Building2 className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CA pipeline</p>
                <p className="text-2xl font-bold">{pipelineCA}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
              {search || statusFilter !== "all"
                ? "Aucun client ne correspond aux filtres."
                : "Ajoutez votre premier client pour commencer."}
            </p>
            {!search && statusFilter === "all" && (
              <Button
                onClick={openCreateDialog}
                className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90"
              >
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
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                      Client
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                      Téléphone
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                      Niche
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                      Statut
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                      Manager
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                      Close rate
                    </th>
                    <th className="p-3 text-right text-xs font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients?.map((client) => {
                    const rate = closeRateFor(client.id);
                    return (
                      <tr
                        key={client.id}
                        onClick={() => handleRowClick(client.id)}
                        className="hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={undefined} />
                              <AvatarFallback className="text-xs bg-[#C6FF00]/20 text-[#C6FF00]">
                                {getInitials(client.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {client.name}
                              </p>
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
                          {client.phone ? (
                            <span className="text-sm flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              {client.phone}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                        <td className="p-3 hidden lg:table-cell">
                          {client.niche ? (
                            <span className="text-sm text-muted-foreground">
                              {client.niche}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              CLIENT_STATUS_COLORS[client.status]
                            )}
                          >
                            {CLIENT_STATUS_LABELS[client.status]}
                          </Badge>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {managerFor(client.id)}
                          </span>
                        </td>
                        <td className="p-3 hidden lg:table-cell">
                          {rate !== null ? (
                            <span
                              className={cn(
                                "text-sm font-medium",
                                rate >= 50
                                  ? "text-emerald-400"
                                  : rate >= 25
                                    ? "text-amber-400"
                                    : "text-red-400"
                              )}
                            >
                              {rate}%
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => openEditDialog(client, e)}
                              title="Modifier"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/crm/${client.id}`);
                              }}
                              title="Voir le détail"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={(e) => handleDelete(client, e)}
                              title="Supprimer"
                            >
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

      </>}

      {/* ═══════════════ PIPELINE TAB (leads par colonnes custom) ═══════════════ */}
      {activeTab === "pipeline" && <>
        {/* Client selector + KPIs */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <Select value={pipelineClientId || ""} onValueChange={(v) => setPipelineClientId(v || null)}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {pipelineStats && (
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">{pipelineStats.total} prospects</span>
              <span>CA: <span className="text-[#C6FF00] font-semibold">{pipelineStats.ca_contracte.toLocaleString("fr-FR")} €</span></span>
              {pipelineStats.relances_today > 0 && (
                <span className="text-red-400 font-medium">{pipelineStats.relances_today} relance{pipelineStats.relances_today > 1 ? "s" : ""}</span>
              )}
            </div>
          )}
        </div>

        {!pipelineClientId ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Sélectionnez un client pour voir son pipeline</CardContent></Card>
        ) : !pipelineColumns?.length ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Chargement des colonnes...</CardContent></Card>
        ) : (
          <>
            {/* Kanban board */}
            <DndContext
              collisionDetection={closestCorners}
              onDragStart={(e) => {
                const l = pipelineLeads?.find((lead) => lead.id === e.active.id);
                setDraggedLead(l || null);
              }}
              onDragEnd={(e) => {
                setDraggedLead(null);
                const { active, over } = e;
                if (!over) return;
                const colId = over.id as string;
                const leadId = active.id as string;
                const lead = pipelineLeads?.find((l) => l.id === leadId);
                const col = pipelineColumns?.find((c) => c.id === colId);
                if (!lead || !col || lead.column_id === colId) return;
                movePipelineLead.mutate({ leadId, columnId: colId, columnName: col.name, clientId: pipelineClientId! });
              }}
            >
              <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-6 md:px-6">
                {pipelineColumns.map((col, idx) => {
                  const colLeads = leadsByColumn[col.id] || [];
                  return (
                    <PipelineKanbanColumn
                      key={col.id}
                      column={col}
                      leads={colLeads}
                      isFirst={idx === 0}
                      quickAddName={quickAddName}
                      onQuickAddChange={setQuickAddName}
                      onQuickAdd={() => {
                        if (!quickAddName.trim() || !pipelineClientId) return;
                        createPipelineLead.mutate({
                          full_name: quickAddName.trim(),
                          client_id: pipelineClientId,
                          column_id: col.id,
                          status: "nouveau" as Lead["status"],
                        });
                        setQuickAddName("");
                      }}
                      onClickLead={setSelectedLead}
                    />
                  );
                })}
              </div>
              <DragOverlay>
                {draggedLead && <PipelineLeadCard lead={draggedLead} isDragOverlay />}
              </DragOverlay>
            </DndContext>
          </>
        )}

        {/* Lead detail drawer */}
        {selectedLead && (
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">{selectedLead.full_name}</h3>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedLead(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedLead.email && <div className="flex justify-between"><span className="text-sm text-muted-foreground">Email</span><span className="text-sm">{selectedLead.email}</span></div>}
              {selectedLead.phone && <div className="flex justify-between"><span className="text-sm text-muted-foreground">Téléphone</span><span className="text-sm">{selectedLead.phone}</span></div>}
              {selectedLead.instagram_url && <div className="flex justify-between"><span className="text-sm text-muted-foreground">Instagram</span><span className="text-sm">{selectedLead.instagram_url}</span></div>}
              {selectedLead.source && <div className="flex justify-between"><span className="text-sm text-muted-foreground">Source</span><Badge variant="outline" className="text-[10px]">{LEAD_SOURCE_LABELS[selectedLead.source] || selectedLead.source}</Badge></div>}
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">CA contracté</span><span className="text-sm font-semibold">{(selectedLead.ca_contracte || 0).toLocaleString("fr-FR")} €</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">CA collecté</span><span className="text-sm">{(selectedLead.ca_collecte || 0).toLocaleString("fr-FR")} €</span></div>
              {selectedLead.date_relance && <div className="flex justify-between"><span className="text-sm text-muted-foreground">Relance</span><span className={cn("text-sm", selectedLead.date_relance <= new Date().toISOString().split("T")[0] ? "text-red-400 font-medium" : "")}>{formatDate(selectedLead.date_relance)}</span></div>}
              {selectedLead.notes && <div><span className="text-sm text-muted-foreground">Notes</span><p className="text-sm mt-1 whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{selectedLead.notes}</p></div>}
              {selectedLead.next_action && <div><span className="text-sm text-muted-foreground">Prochaine action</span><p className="text-sm mt-1">{selectedLead.next_action}</p></div>}
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Ajouté le</span><span className="text-sm">{formatDate(selectedLead.created_at)}</span></div>
              <div className="pt-4 flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => { deletePipelineLead.mutate(selectedLead.id); setSelectedLead(null); }}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Supprimer
                </Button>
              </div>
            </div>
          </div>
        )}
        {selectedLead && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedLead(null)} />}
      </>}

      {/* ═══════════════ BILAN TAB ═══════════════ */}
      {activeTab === "bilan" && <>
        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C6FF00]/10">
                  <Target className="h-5 w-5 text-[#C6FF00]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total leads</p>
                  <p className="text-2xl font-bold">{leadStats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CA closé</p>
                  <p className="text-2xl font-bold">{(leadStats?.ca_close || 0).toLocaleString("fr-FR")} €</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pipeline value</p>
                  <p className="text-2xl font-bold">{(leadStats?.pipeline_value || 0).toLocaleString("fr-FR")} €</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Marge nette</p>
                  <p className="text-2xl font-bold">{(financeStats?.margin || 0).toLocaleString("fr-FR")} €</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: LEAD_STAGE_COLORS[status] }}
                      />
                    </div>
                    <div className="w-10 text-right text-sm font-semibold">{count}</div>
                    <div className="w-24 text-right text-sm text-muted-foreground">{value.toLocaleString("fr-FR")} €</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Finance summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Revenus</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CA total</span>
                  <span className="font-semibold text-emerald-400">{(financeStats?.total_ca || 0).toLocaleString("fr-FR")} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CA encaissé</span>
                  <span className="font-semibold">{(financeStats?.ca_encaisse || 0).toLocaleString("fr-FR")} €</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="text-muted-foreground">Charges totales</span>
                  <span className="font-semibold text-red-400">{(financeStats?.total_charges || 0).toLocaleString("fr-FR")} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Marge</span>
                  <span className={cn("font-bold", (financeStats?.margin || 0) >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {(financeStats?.margin || 0).toLocaleString("fr-FR")} €
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Clients</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total clients</span>
                  <span className="font-semibold">{totalClients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clients actifs</span>
                  <span className="font-semibold text-emerald-400">{activeClients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taux closing moyen</span>
                  <span className="font-semibold">{avgClosingRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leads closés</span>
                  <span className="font-semibold">{leadStats?.close || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>}
    </div>
  );
}

// ─── Kanban Column ──────────────────────────────────────

// ─── Pipeline Kanban Column ─────────────────────────────

function PipelineKanbanColumn({
  column,
  leads,
  isFirst,
  quickAddName,
  onQuickAddChange,
  onQuickAdd,
  onClickLead,
}: {
  column: PipelineColumn;
  leads: Lead[];
  isFirst: boolean;
  quickAddName: string;
  onQuickAddChange: (v: string) => void;
  onQuickAdd: () => void;
  onClickLead: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const relanceCount = leads.filter((l) => l.date_relance && l.date_relance <= new Date().toISOString().split("T")[0]).length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-[260px] rounded-xl border border-border bg-card/50 flex flex-col max-h-[calc(100vh-18rem)]",
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
          <Badge className="bg-red-500/20 text-red-400 text-[10px] h-5 animate-pulse">{relanceCount}</Badge>
        )}
      </div>
      {/* Quick add on first column */}
      {isFirst && (
        <div className="p-2 border-b border-border">
          <form onSubmit={(e) => { e.preventDefault(); onQuickAdd(); }} className="flex gap-1">
            <Input
              value={quickAddName}
              onChange={(e) => onQuickAddChange(e.target.value)}
              placeholder="+ Nouveau prospect"
              className="h-7 text-xs bg-[#141414] border-0"
            />
          </form>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {leads.map((lead) => (
          <DraggablePipelineCard key={lead.id} lead={lead} onClick={() => onClickLead(lead)} />
        ))}
        {leads.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">Aucun prospect</div>
        )}
      </div>
    </div>
  );
}

function DraggablePipelineCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div ref={setNodeRef} className={cn(isDragging && "opacity-40")}>
      <PipelineLeadCard lead={lead} dragHandleProps={{ ...attributes, ...listeners }} onClick={onClick} />
    </div>
  );
}

function PipelineLeadCard({
  lead,
  isDragOverlay,
  dragHandleProps,
  onClick,
}: {
  lead: Lead;
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
        isOverdue ? "border-red-500/50" : "border-border",
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
      {lead.email && <p className="text-[11px] text-muted-foreground truncate pl-6">{lead.email}</p>}
      <div className="flex items-center gap-2 pl-6 flex-wrap">
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
        <p className={cn("text-[10px] pl-6", isOverdue ? "text-red-400 font-medium" : "text-muted-foreground")}>
          Relance : {lead.date_relance}
        </p>
      )}
    </div>
  );
}
