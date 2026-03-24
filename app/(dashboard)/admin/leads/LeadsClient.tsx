"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GripVertical,
  Plus,
  Trash2,
  Mail,
  Phone,
  Instagram,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { logSupabaseError } from "@/lib/error-logger";
import type { Lead, LeadStatus } from "@/lib/types/database";

// ─── Pipeline Stages ────────────────────────────────────────

interface StageConfig {
  value: LeadStatus;
  label: string;
  dotColor: string;
}

const STAGES: StageConfig[] = [
  { value: "nouveau", label: "Nouveau", dotColor: "bg-blue-400" },
  { value: "qualifie", label: "Qualifié", dotColor: "bg-indigo-400" },
  { value: "appel_booke", label: "Appel Booké", dotColor: "bg-purple-500" },
  { value: "en_reflexion", label: "En Réflexion", dotColor: "bg-amber-500" },
  { value: "close", label: "Closé", dotColor: "bg-emerald-500" },
  { value: "perdu", label: "Perdu", dotColor: "bg-zinc-400" },
  { value: "no_show", label: "No-Show", dotColor: "bg-red-400" },
];

const SOURCES = [
  { value: "instagram", label: "Instagram" },
  { value: "referral", label: "Referral" },
  { value: "ads", label: "Publicités" },
  { value: "website", label: "Site web" },
  { value: "cold_dm", label: "Cold DM" },
  { value: "skool", label: "Skool" },
  { value: "other", label: "Autre" },
];

// ─── Deal Card ──────────────────────────────────────────────

function DealCard({
  lead,
  isDragging,
  onDelete,
}: {
  lead: Lead;
  isDragging?: boolean;
  onDelete?: () => void;
}) {
  return (
    <div
      className={cn(
        "bg-[#1C1C1C] border border-border rounded-xl p-3.5 group transition-all duration-200 relative",
        isDragging
          ? "shadow-2xl opacity-90 rotate-1 scale-[1.03] ring-2 ring-neon/20"
          : "hover:border-neon/30 hover:shadow-md hover:-translate-y-0.5",
        lead.estimated_value >= 3000 && "border-l-[3px] border-l-neon",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex flex-col items-center gap-0.5 mt-0.5 shrink-0 cursor-grab opacity-40 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-foreground truncate">
              {lead.full_name}
            </p>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 text-transparent group-hover:text-muted-foreground hover:!text-red-500 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {(lead.email || lead.phone || lead.instagram_url) && (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
              {lead.email && (
                <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {lead.email.split("@")[0]}
                </span>
              )}
              {lead.phone && (
                <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                </span>
              )}
              {lead.instagram_url && (
                <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                  <Instagram className="w-3 h-3" />
                </span>
              )}
            </div>
          )}

          {lead.estimated_value > 0 && (
            <div className="mt-2.5">
              <span
                className={cn(
                  "inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md font-mono tabular-nums",
                  lead.estimated_value >= 3000
                    ? "bg-neon text-black"
                    : "text-foreground bg-white/5",
                )}
              >
                {lead.estimated_value.toLocaleString("fr-FR")} €
              </span>
            </div>
          )}

          {lead.next_action && (
            <p className="text-[11px] text-muted-foreground mt-1.5 truncate">
              → {lead.next_action}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Draggable Wrapper ──────────────────────────────────────

function DraggableDeal({
  lead,
  onDelete,
}: {
  lead: Lead;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, touchAction: "none" }}
      {...listeners}
      {...attributes}
      className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-30")}
    >
      <DealCard lead={lead} onDelete={onDelete} />
    </div>
  );
}

// ─── Droppable Column ───────────────────────────────────────

function StageColumn({
  stage,
  leads,
  onDelete,
}: {
  stage: StageConfig;
  leads: Lead[];
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.value });

  const total = leads.reduce((sum, l) => sum + Number(l.estimated_value), 0);

  return (
    <div ref={setNodeRef} className="flex flex-col min-w-[260px] w-[260px] shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between px-2 mb-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-2.5 h-2.5 rounded-full", stage.dotColor)} />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            {stage.label}
          </span>
          <span className="text-[10px] text-foreground font-mono font-semibold tabular-nums bg-white/5 border border-border px-1.5 py-0.5 rounded-md">
            {leads.length}
          </span>
        </div>
        {total > 0 && (
          <span className="text-[11px] font-semibold text-muted-foreground font-mono tabular-nums">
            {total.toLocaleString("fr-FR")} €
          </span>
        )}
      </div>

      {/* Cards */}
      <div
        className={cn(
          "flex-1 space-y-2.5 rounded-xl p-2 -m-2 transition-all duration-200",
          isOver && "bg-neon/5 ring-1 ring-inset ring-neon/20 shadow-inner",
        )}
      >
        {leads.map((lead) => (
          <DraggableDeal
            key={lead.id}
            lead={lead}
            onDelete={() => onDelete(lead.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

interface LeadsClientProps {
  leads: Lead[];
  userId: string;
}

export function LeadsClient({ leads: initial, userId }: LeadsClientProps) {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>(initial);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formInstagram, setFormInstagram] = useState("");
  const [formSource, setFormSource] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  // Filter leads by search
  const filtered = useMemo(() => {
    if (!search) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.full_name.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.includes(q)
    );
  }, [leads, search]);

  // Group by stage
  const leadsByStage = useMemo(() => {
    const map = new Map<LeadStatus, Lead[]>();
    STAGES.forEach((s) => map.set(s.value, []));
    filtered.forEach((l) => {
      const list = map.get(l.status);
      if (list) list.push(l);
    });
    return map;
  }, [filtered]);

  const activeLead = activeId ? leads.find((l) => l.id === activeId) ?? null : null;

  // ─── Drag & Drop ──────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const leadId = String(active.id);
    const newStatus = String(over.id) as LeadStatus;

    if (!STAGES.some((s) => s.value === newStatus)) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId);

    if (error) {
      logSupabaseError("move lead", error);
      toast.error("Erreur lors du déplacement");
      // Rollback
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: lead.status } : l))
      );
    }
  };

  // ─── CRUD ─────────────────────────────────────────────────

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormInstagram("");
    setFormSource("");
    setFormValue("");
    setFormNotes("");
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("leads")
      .insert({
        full_name: formName.trim(),
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
        instagram_url: formInstagram.trim() || null,
        source: formSource || null,
        estimated_value: parseFloat(formValue) || 0,
        notes: formNotes.trim() || null,
        status: "nouveau",
        created_by: userId,
        assigned_to: userId,
      })
      .select()
      .single();

    if (error) {
      logSupabaseError("create lead", error);
      toast.error("Erreur de création");
    } else {
      setLeads((prev) => [data, ...prev]);
      toast.success("Lead ajouté");
      resetForm();
      setShowAdd(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce lead ?")) return;
    const prev = leads;
    setLeads((p) => p.filter((l) => l.id !== id));

    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      logSupabaseError("delete lead", error);
      toast.error("Erreur de suppression");
      setLeads(prev);
    } else {
      toast.success("Lead supprimé");
    }
  };

  // Stats
  const totalValue = leads
    .filter((l) => l.status !== "perdu" && l.status !== "no_show")
    .reduce((sum, l) => sum + Number(l.estimated_value), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pipeline Leads</h1>
          <p className="text-muted-foreground text-sm">
            {leads.length} lead{leads.length > 1 ? "s" : ""}
            {totalValue > 0 && (
              <span className="ml-2 font-semibold text-foreground font-mono">
                {totalValue.toLocaleString("fr-FR")} €
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 w-48"
            />
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-neon text-black hover:bg-neon/90">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau lead
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-5 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
          {STAGES.map((stage) => (
            <StageColumn
              key={stage.value}
              stage={stage}
              leads={leadsByStage.get(stage.value) ?? []}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? (
            <div className="w-[240px]">
              <DealCard lead={activeLead} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Lead Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nom complet *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Jean Dupont" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} type="email" placeholder="jean@example.com" />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+33 6 00 00 00 00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Instagram</Label>
                <Input value={formInstagram} onChange={(e) => setFormInstagram(e.target.value)} placeholder="@username" />
              </div>
              <div>
                <Label>Source</Label>
                <Select value={formSource} onValueChange={setFormSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Valeur estimée (€)</Label>
              <Input value={formValue} onChange={(e) => setFormValue(e.target.value)} type="number" min="0" placeholder="5000" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Contexte, besoins identifiés..." rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" className="text-white hover:text-white" onClick={() => setShowAdd(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !formName.trim()}
                className="bg-neon text-black hover:bg-neon/90"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
