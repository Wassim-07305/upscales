"use client";

import { useState, useMemo } from "react";
import { useMyLeads, useMyLeadStats, useCreateLead, useUpdateLead, useDeleteLead } from "@/lib/hooks/use-leads";
import type { Lead, LeadStatus, ClientScopeStatus } from "@/lib/types/database";
import {
  LEAD_STATUS_LABELS, LEAD_STATUS_COLORS,
  LEAD_SOURCES, LEAD_SOURCE_LABELS, LEAD_SOURCE_COLORS,
  CLIENT_SCOPE_STATUSES, CLIENT_SCOPE_STATUS_LABELS, CLIENT_SCOPE_STATUS_COLORS,
} from "@/lib/constants/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Plus, Pencil, Trash2, Phone, Mail, Instagram, X,
  Users, Target, TrendingUp, AlertCircle, BarChart3, List, Kanban,
  GripVertical, Calendar, DollarSign,
} from "lucide-react";
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, rectIntersection, type CollisionDetection } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/dates";

// ─── Types ───────────────────────────────────────────────

interface LeadFormState {
  full_name: string;
  email: string;
  phone: string;
  instagram_url: string;
  source: string;
  notes: string;
  ca_contracte: number;
  ca_collecte: number;
  nombre_paiements: number;
  date_relance: string;
  call_time: string;
}

const emptyForm: LeadFormState = {
  full_name: "", email: "", phone: "", instagram_url: "",
  source: "instagram", notes: "", ca_contracte: 0, ca_collecte: 0,
  nombre_paiements: 1, date_relance: "", call_time: "",
};

type ProspectTab = "liste" | "pipeline" | "bilan";

// ─── Main Component ─────────────────────────────────────

export function MyProspectsClient({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<ProspectTab>("liste");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes Prospects</h1>
          <p className="text-muted-foreground text-sm">Gérez vos prospects et suivez votre pipeline</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        {([
          { value: "liste" as ProspectTab, label: "Liste", icon: List },
          { value: "pipeline" as ProspectTab, label: "Pipeline", icon: Kanban },
          { value: "bilan" as ProspectTab, label: "Bilan", icon: BarChart3 },
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

      {activeTab === "liste" && <ListeTab userId={userId} />}
      {activeTab === "pipeline" && <PipelineTab userId={userId} />}
      {activeTab === "bilan" && <BilanTab userId={userId} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LISTE TAB
// ═══════════════════════════════════════════════════════════

function ListeTab({ userId }: { userId: string }) {
  const { data: leads, isLoading } = useMyLeads(userId);
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadFormState>(emptyForm);

  const myLeads = leads || [];

  const filtered = myLeads.filter((l) => {
    const matchSearch = !search || l.full_name.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = myLeads.length;
  const booke = myLeads.filter((l) => l.status === "booké").length;
  const aRelancer = myLeads.filter((l) => l.status === "à_relancer").length;
  const close = myLeads.filter((l) => l.client_status === "closé").length;

  const openCreate = () => { setEditingLead(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setForm({
      full_name: lead.full_name, email: lead.email || "", phone: lead.phone || "",
      instagram_url: lead.instagram_url || "", source: lead.source || "instagram",
      notes: lead.notes || "", ca_contracte: lead.ca_contracte || 0,
      ca_collecte: lead.ca_collecte || 0, nombre_paiements: lead.nombre_paiements || 1,
      date_relance: lead.date_relance || "", call_time: lead.call_time || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { toast.error("Le nom est requis"); return; }
    if (editingLead) {
      await updateLead.mutateAsync({ id: editingLead.id, ...form, email: form.email || null, phone: form.phone || null, instagram_url: form.instagram_url || null, notes: form.notes || null, date_relance: form.date_relance || null, call_time: form.call_time || null });
    } else {
      await createLead.mutateAsync({ ...form, created_by: userId, assigned_to: userId, status: "à_relancer" as LeadStatus, client_status: "contacté" as ClientScopeStatus, email: form.email || null, phone: form.phone || null, instagram_url: form.instagram_url || null, notes: form.notes || null, date_relance: form.date_relance || null, call_time: form.call_time || null } as Partial<Lead>);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce prospect ?")) return;
    await deleteLead.mutateAsync(id);
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-[400px] rounded-xl" /></div>;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Total" value={total} color="text-primary" bg="bg-primary/10" />
        <KPICard icon={AlertCircle} label="À relancer" value={aRelancer} color="text-amber-400" bg="bg-amber-500/10" />
        <KPICard icon={Target} label="Bookés" value={booke} color="text-blue-400" bg="bg-blue-500/10" />
        <KPICard icon={TrendingUp} label="Closés" value={close} color="text-emerald-400" bg="bg-emerald-500/10" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un prospect..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Ajouter</Button>
      </div>

      {/* Lead list */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">Aucun prospect trouvé</p>
          <p className="text-sm text-muted-foreground mt-1">Ajoutez votre premier prospect pour commencer</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <Card key={lead.id} className="hover:border-primary/20 transition-colors">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{lead.full_name}</p>
                      {lead.source && <Badge variant="outline" className={cn("text-[10px]", LEAD_SOURCE_COLORS[lead.source])}>{LEAD_SOURCE_LABELS[lead.source] || lead.source}</Badge>}
                      {lead.client_status && <Badge variant="outline" className="text-[10px]">{CLIENT_SCOPE_STATUS_LABELS[lead.client_status] || lead.client_status}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                      {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                      {lead.instagram_url && (
                        <a href={lead.instagram_url.startsWith("http") ? lead.instagram_url : `https://instagram.com/${lead.instagram_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-pink-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                          <Instagram className="h-3 w-3" />Instagram
                        </a>
                      )}
                      {(lead.ca_contracte || 0) > 0 && <span className="text-primary font-medium">{lead.ca_contracte.toLocaleString("fr-FR")} €</span>}
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]", LEAD_STATUS_COLORS[lead.status])}>{LEAD_STATUS_LABELS[lead.status] || lead.status}</Badge>
                  <span className="text-xs text-muted-foreground hidden md:block w-20 text-right">{formatDate(lead.created_at)}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(lead)} aria-label="Modifier"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(lead.id)} aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingLead ? "Modifier le prospect" : "Nouveau prospect"}</DialogTitle></DialogHeader>
          <LeadFormFields form={form} setForm={setForm} />
          <Button onClick={handleSubmit} className="w-full" disabled={createLead.isPending || updateLead.isPending}>
            {editingLead ? "Enregistrer" : "Ajouter le prospect"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// PIPELINE TAB — Kanban by client_status
// ═══════════════════════════════════════════════════════════

function PipelineTab({ userId }: { userId: string }) {
  const { data: leads, isLoading } = useMyLeads(userId);
  const { data: stats } = useMyLeadStats(userId);
  const updateLead = useUpdateLead();
  const createLead = useCreateLead();
  const deleteLead = useDeleteLead();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadFormState>(emptyForm);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const statusSet = new Set<string>(CLIENT_SCOPE_STATUSES);

  const leadsByStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of CLIENT_SCOPE_STATUSES) map[s] = [];
    for (const l of leads || []) {
      if (map[l.client_status]) map[l.client_status].push(l);
    }
    return map;
  }, [leads]);

  // Only match droppable columns, ignore draggable cards
  const columnOnlyCollision: CollisionDetection = (args) => {
    const collisions = rectIntersection(args);
    return collisions.filter((c) => statusSet.has(c.id as string));
  };

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
    await createLead.mutateAsync({
      full_name: leadForm.full_name.trim(), email: leadForm.email.trim() || null,
      phone: leadForm.phone.trim() || null, instagram_url: leadForm.instagram_url.trim() || null,
      source: leadForm.source || null, ca_contracte: leadForm.ca_contracte || 0,
      ca_collecte: leadForm.ca_collecte || 0, nombre_paiements: leadForm.nombre_paiements || 1,
      date_relance: leadForm.date_relance || null, call_time: leadForm.call_time || null,
      notes: leadForm.notes.trim() || null, client_status: "contacté" as ClientScopeStatus,
      status: "à_relancer" as LeadStatus, created_by: userId, assigned_to: userId,
    } as Partial<Lead>);
    setLeadDialogOpen(false);
    setLeadForm(emptyForm);
  };

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadForm({
      full_name: lead.full_name, email: lead.email || "", phone: lead.phone || "",
      instagram_url: lead.instagram_url || "", source: lead.source || "instagram",
      notes: lead.notes || "", ca_contracte: lead.ca_contracte || 0,
      ca_collecte: lead.ca_collecte || 0, nombre_paiements: lead.nombre_paiements || 1,
      date_relance: lead.date_relance || "", call_time: lead.call_time || "",
    });
    setEditingLead(false);
  };

  if (isLoading) return <div className="flex gap-3 overflow-hidden">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[500px] w-[280px] flex-shrink-0 rounded-xl" />)}</div>;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Button onClick={() => { setLeadForm(emptyForm); setLeadDialogOpen(true); }} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Nouveau prospect</Button>
        {stats && (
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="text-muted-foreground">{stats.total} prospects</span>
            {stats.ca_contracte > 0 && <span>CA : <span className="text-primary font-semibold">{stats.ca_contracte.toLocaleString("fr-FR")} €</span></span>}
            {stats.relances_overdue > 0 && <span className="text-red-400 font-medium flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{stats.relances_overdue} relance{stats.relances_overdue > 1 ? "s" : ""}</span>}
          </div>
        )}
      </div>

      <DndContext collisionDetection={columnOnlyCollision} onDragStart={(e) => setDraggedLead(leads?.find((l) => l.id === e.active.id) || null)} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-6 md:px-6">
          {CLIENT_SCOPE_STATUSES.map((status) => (
            <PipelineColumn key={status} status={status} leads={leadsByStatus[status] || []} onClickLead={openLeadDetail} />
          ))}
        </div>
        <DragOverlay>{draggedLead && <PipelineCard lead={draggedLead} isDragOverlay />}</DragOverlay>
      </DndContext>

      {/* New Lead Dialog */}
      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouveau prospect</DialogTitle></DialogHeader>
          <LeadFormFields form={leadForm} setForm={setLeadForm} />
          <Button onClick={handleAddLead} disabled={createLead.isPending} className="w-full">{createLead.isPending ? "Ajout..." : "Ajouter"}</Button>
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
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className={cn("text-[10px]", LEAD_STATUS_COLORS[selectedLead.status])}>{LEAD_STATUS_LABELS[selectedLead.status]}</Badge>
                  <Badge variant="outline" className="text-[10px]">{CLIENT_SCOPE_STATUS_LABELS[selectedLead.client_status]}</Badge>
                </div>
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
                    <Button onClick={async () => { await updateLead.mutateAsync({ id: selectedLead.id, ...leadForm, email: leadForm.email || null, phone: leadForm.phone || null, instagram_url: leadForm.instagram_url || null, notes: leadForm.notes || null, date_relance: leadForm.date_relance || null, call_time: leadForm.call_time || null }); setEditingLead(false); setSelectedLead(null); }} disabled={updateLead.isPending} className="flex-1">{updateLead.isPending ? "..." : "Enregistrer"}</Button>
                    <Button variant="outline" onClick={() => setEditingLead(false)}>Annuler</Button>
                  </div>
                </>
              ) : (
                <LeadDetailView lead={selectedLead} />
              )}
              {!editingLead && (
                <div className="pt-4 border-t border-border">
                  <Button size="sm" variant="destructive" onClick={() => { if (!confirm("Supprimer ?")) return; deleteLead.mutate(selectedLead.id); setSelectedLead(null); }}><Trash2 className="h-3.5 w-3.5 mr-1.5" />Supprimer</Button>
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

function BilanTab({ userId }: { userId: string }) {
  const { data: stats } = useMyLeadStats(userId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="grid grid-cols-2 gap-4 md:col-span-2">
        <KPICard icon={Target} label="Total prospects" value={stats?.total || 0} color="text-primary" bg="bg-primary/10" />
        <KPICard icon={DollarSign} label="CA contracté" value={`${(stats?.ca_contracte || 0).toLocaleString("fr-FR")} €`} color="text-emerald-400" bg="bg-emerald-500/10" />
        <KPICard icon={TrendingUp} label="Pipeline" value={`${(stats?.pipeline_value || 0).toLocaleString("fr-FR")} €`} color="text-blue-400" bg="bg-blue-500/10" />
        <KPICard icon={DollarSign} label="CA collecté" value={`${(stats?.ca_collecte || 0).toLocaleString("fr-FR")} €`} color="text-purple-400" bg="bg-purple-500/10" />
      </div>

      <Card><CardContent className="p-6">
        <h3 className="font-semibold mb-4">Pipeline</h3>
        <div className="space-y-3">
          <SRow label="Total prospects" value={stats?.total || 0} />
          <SRow label="À relancer" value={stats?.a_relancer || 0} vc="text-amber-400" />
          <SRow label="Bookés" value={stats?.booke || 0} vc="text-blue-400" />
          <SRow label="Closés" value={stats?.close || 0} vc="text-emerald-400" />
          <SRow label="Perdus" value={stats?.perdu || 0} vc="text-red-400" />
          {(stats?.relances_overdue || 0) > 0 && (
            <>
              <div className="border-t border-border pt-3" />
              <SRow label="Relances en retard" value={stats?.relances_overdue || 0} vc="text-red-400 font-bold" />
            </>
          )}
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-6">
        <h3 className="font-semibold mb-4">Finances</h3>
        <div className="space-y-3">
          <SRow label="CA contracté" value={`${(stats?.ca_contracte || 0).toLocaleString("fr-FR")} €`} vc="text-emerald-400 font-semibold" />
          <SRow label="CA collecté" value={`${(stats?.ca_collecte || 0).toLocaleString("fr-FR")} €`} />
          <SRow label="Valeur pipeline" value={`${(stats?.pipeline_value || 0).toLocaleString("fr-FR")} €`} vc="text-blue-400" />
          {stats && stats.total > 0 && (
            <>
              <div className="border-t border-border pt-3" />
              <SRow label="Taux de closing" value={`${stats.total > 0 ? Math.round((stats.close / stats.total) * 100) : 0}%`} vc={stats.close / stats.total >= 0.2 ? "text-emerald-400 font-bold" : "text-amber-400"} />
            </>
          )}
        </div>
      </CardContent></Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════

function PipelineColumn({ status, leads, onClickLead }: { status: ClientScopeStatus; leads: Lead[]; onClickLead: (l: Lead) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const totalCA = leads.reduce((s, l) => s + (l.ca_contracte || 0), 0);

  return (
    <div ref={setNodeRef} className={cn("flex-shrink-0 w-[280px] rounded-xl border border-border bg-card/50 flex flex-col max-h-[calc(100vh-16rem)] border-t-4", CLIENT_SCOPE_STATUS_COLORS[status], isOver && "ring-2 ring-primary/50 bg-primary/5")}>
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
        {leads.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground">Aucun prospect</div>}
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

  return (
    <div onClick={onClick} className={cn(
      "rounded-lg border bg-card p-3 space-y-1.5 cursor-pointer hover:border-primary/30 transition-colors",
      isOverdue ? "border-red-500/50 bg-red-500/5" : "border-border",
      isDragOverlay && "shadow-xl ring-2 ring-primary/30 rotate-2"
    )}>
      <div className="flex items-center gap-2">
        <button {...(dragHandleProps || {})} className="cursor-grab active:cursor-grabbing text-muted-foreground" onClick={(e) => e.stopPropagation()}><GripVertical className="h-4 w-4" /></button>
        <p className="text-sm font-medium truncate flex-1">{lead.full_name}</p>
        {isOverdue && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
      </div>
      <div className="flex items-center gap-2 pl-6 flex-wrap">
        {lead.source && <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 border-0", LEAD_SOURCE_COLORS[lead.source])}>{LEAD_SOURCE_LABELS[lead.source] || lead.source}</Badge>}
        {(lead.ca_contracte || 0) > 0 && <span className="text-[10px] font-semibold text-primary">{lead.ca_contracte.toLocaleString("fr-FR")} €</span>}
      </div>
      {lead.date_relance && <p className={cn("text-[10px] pl-6 flex items-center gap-1", isOverdue ? "text-red-400 font-medium" : "text-muted-foreground")}><Calendar className="h-3 w-3" />Relance : {formatDate(lead.date_relance)}</p>}
    </div>
  );
}

function LeadFormFields({ form, setForm }: { form: LeadFormState; setForm: React.Dispatch<React.SetStateAction<LeadFormState>> }) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2"><Label>Nom *</Label><Input placeholder="Nom du prospect" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2"><Label>Email</Label><Input type="email" placeholder="email@exemple.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
        <div className="grid gap-2"><Label>Téléphone</Label><Input placeholder="+33 6 00 00 00 00" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2"><Label>Instagram</Label><Input placeholder="@handle" value={form.instagram_url} onChange={(e) => setForm((f) => ({ ...f, instagram_url: e.target.value }))} /></div>
        <div className="grid gap-2"><Label>Source</Label>
          <Select value={form.source} onValueChange={(v) => setForm((f) => ({ ...f, source: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2"><Label>CA contracté (€)</Label><Input type="number" value={form.ca_contracte || ""} onChange={(e) => setForm((f) => ({ ...f, ca_contracte: Number(e.target.value) || 0 }))} /></div>
        <div className="grid gap-2"><Label>CA collecté (€)</Label><Input type="number" value={form.ca_collecte || ""} onChange={(e) => setForm((f) => ({ ...f, ca_collecte: Number(e.target.value) || 0 }))} /></div>
        <div className="grid gap-2"><Label>Nb paiements</Label><Input type="number" value={form.nombre_paiements || ""} onChange={(e) => setForm((f) => ({ ...f, nombre_paiements: Number(e.target.value) || 1 }))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2"><Label>Date de relance</Label><Input type="date" value={form.date_relance} onChange={(e) => setForm((f) => ({ ...f, date_relance: e.target.value }))} /></div>
        <div className="grid gap-2"><Label>Créneau appel</Label><Input placeholder="14h-15h" value={form.call_time} onChange={(e) => setForm((f) => ({ ...f, call_time: e.target.value }))} /></div>
      </div>
      <div className="grid gap-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes..." rows={3} /></div>
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
      {lead.date_relance && <DRow label="Relance" value={formatDate(lead.date_relance)} vc={isOverdue ? "text-red-400 font-medium" : ""} />}
      {lead.notes && <div><span className="text-sm text-muted-foreground">Notes</span><p className="text-sm mt-1 whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{lead.notes}</p></div>}
      <DRow label="Ajouté le" value={formatDate(lead.created_at)} />
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color, bg }: { icon: React.ElementType; label: string; value: string | number; color: string; bg: string }) {
  return <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-3"><div className={cn("p-2 rounded-lg", bg, color)}><Icon className="h-4 w-4" /></div><div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></div></CardContent></Card>;
}

function DRow({ label, value, vc }: { label: string; value: string | number; vc?: string }) {
  return <div className="flex justify-between"><span className="text-sm text-muted-foreground">{label}</span><span className={cn("text-sm", vc)}>{value}</span></div>;
}

function SRow({ label, value, vc }: { label: string; value: string | number; vc?: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className={cn("font-semibold", vc)}>{value}</span></div>;
}
