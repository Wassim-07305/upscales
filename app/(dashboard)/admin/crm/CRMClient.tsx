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
import type { Client, ClientStatus } from "@/lib/types/database";
import {
  CLIENT_STATUSES,
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_COLORS,
  ASSIGNMENT_ROLE_LABELS,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  Phone,
  Mail,
  Building2,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Component ───────────────────────────────────────────

export function CRMClient() {
  const router = useRouter();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormState>(emptyForm);

  // Queries
  const { data: clients, isLoading } = useClients({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const { data: allAssignments } = useAllClientAssignments();
  const { data: closingRates } = useClosingRates();

  // Mutations
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

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
          <h1 className="text-2xl font-bold">CRM — Clients</h1>
          <p className="text-muted-foreground">
            Gestion et suivi de vos clients
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
    </div>
  );
}
