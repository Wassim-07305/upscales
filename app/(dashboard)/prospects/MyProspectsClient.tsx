"use client";

import { useState } from "react";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from "@/lib/hooks/use-leads";
import type { Lead, LeadStatus } from "@/lib/types/database";
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
  Search, Plus, Pencil, Trash2, Phone, Mail, Instagram,
  Users, Target, TrendingUp, AlertCircle,
} from "lucide-react";
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
}

const emptyForm: LeadFormState = {
  full_name: "", email: "", phone: "", instagram_url: "",
  source: "instagram", notes: "",
};

// ─── Component ───────────────────────────────────────────

export function MyProspectsClient({ userId }: { userId: string }) {
  const { data: leads, isLoading } = useLeads({ assignedTo: userId });
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadFormState>(emptyForm);

  const myLeads = (leads || []).filter((l) => l.created_by === userId);

  const filtered = myLeads.filter((l) => {
    const matchSearch = !search || l.full_name.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const total = myLeads.length;
  const booke = myLeads.filter((l) => l.status === "booké").length;
  const aRelancer = myLeads.filter((l) => l.status === "à_relancer").length;
  const close = myLeads.filter((l) => l.client_status === "closé").length;

  const openCreate = () => {
    setEditingLead(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setForm({
      full_name: lead.full_name,
      email: lead.email || "",
      phone: lead.phone || "",
      instagram_url: lead.instagram_url || "",
      source: lead.source || "instagram",
      notes: lead.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.full_name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    if (editingLead) {
      await updateLead.mutateAsync({ id: editingLead.id, ...form });
    } else {
      await createLead.mutateAsync({
        ...form,
        created_by: userId,
        assigned_to: userId,
        status: "à_relancer",
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce prospect ?")) return;
    await deleteLead.mutateAsync(id);
  };

  const handleStatusChange = async (lead: Lead, newStatus: LeadStatus) => {
    await updateLead.mutateAsync({ id: lead.id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes Prospects</h1>
          <p className="text-muted-foreground text-sm">Gérez vos prospects et suivez votre pipeline</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: total, icon: Users, color: "text-primary" },
          { label: "À relancer", value: aRelancer, icon: AlertCircle, color: "text-amber-400" },
          { label: "Bookés", value: booke, icon: Target, color: "text-blue-400" },
          { label: "Closés", value: close, icon: TrendingUp, color: "text-emerald-400" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un prospect..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lead list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Aucun prospect trouvé</p>
            <p className="text-sm text-muted-foreground mt-1">Ajoutez votre premier prospect pour commencer</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <Card key={lead.id} className="hover:border-primary/20 transition-colors">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{lead.full_name}</p>
                      {lead.source && (
                        <Badge variant="outline" className={cn("text-[10px]", LEAD_SOURCE_COLORS[lead.source])}>
                          {LEAD_SOURCE_LABELS[lead.source] || lead.source}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </span>
                      )}
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </span>
                      )}
                      {lead.instagram_url && (
                        <a
                          href={lead.instagram_url.startsWith("http") ? lead.instagram_url : `https://instagram.com/${lead.instagram_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-pink-400 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Instagram className="h-3 w-3" />
                          Instagram
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <Select
                    value={lead.status}
                    onValueChange={(v) => handleStatusChange(lead, v as LeadStatus)}
                  >
                    <SelectTrigger className="w-[130px] h-7 border-0 p-0">
                      <Badge variant="outline" className={cn("text-[10px] cursor-pointer", LEAD_STATUS_COLORS[lead.status])}>
                        {LEAD_STATUS_LABELS[lead.status] || lead.status}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Date */}
                  <span className="text-xs text-muted-foreground hidden md:block w-20 text-right">
                    {formatDate(lead.created_at)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(lead)} aria-label="Modifier">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(lead.id)} aria-label="Supprimer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Modifier le prospect" : "Nouveau prospect"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom complet *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jean Dupont" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" type="email" />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+33 6 12 34 56 78" />
              </div>
            </div>
            <div>
              <Label>Instagram</Label>
              <Input value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} placeholder="@pseudo ou URL" />
            </div>
            <div>
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes sur ce prospect..." rows={3} />
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={createLead.isPending || updateLead.isPending}>
              {editingLead ? "Enregistrer" : "Ajouter le prospect"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
