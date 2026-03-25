"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/dates";
import { getInitials } from "@/lib/utils/formatters";

// ─── Hooks ──────────────────────────────────────────────
import { useClient, useClientAssignments, useUpdateClient, useUpsertAssignment, useDeleteAssignment } from "@/lib/hooks/use-clients";
import { useLeadsByClient, useCreateLead, useUpdateLead } from "@/lib/hooks/use-crm-leads";
import { useCallCalendar, useCreateCall } from "@/lib/hooks/use-call-calendar";
import { useCloserCalls, useCreateCloserCall } from "@/lib/hooks/use-closer-calls";
import { useFinancialEntries, useFinanceStats, useCreateFinancialEntry } from "@/lib/hooks/use-finances";

// ─── Constants ──────────────────────────────────────────
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_COLORS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  CALL_TYPES,
  CALL_TYPE_LABELS,
  CALL_STATUSES,
  CALL_STATUS_LABELS,
  CLOSER_CALL_STATUSES,
  CLOSER_CALL_STATUS_LABELS,
  CLOSER_CALL_STATUS_COLORS,
  FINANCIAL_TYPES,
  FINANCIAL_TYPE_LABELS,
  FINANCIAL_TYPE_COLORS,
  ASSIGNMENT_ROLES,
  ASSIGNMENT_ROLE_LABELS,
} from "@/lib/constants/crm";

// ─── UI Components ──────────────────────────────────────
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

// ─── Icons ──────────────────────────────────────────────
import {
  ChevronLeft,
  Users,
  TrendingUp,
  Phone,
  DollarSign,
  Plus,
  Loader2,
  Mail,
  Globe,
  UserCircle,
  Calendar,
  Target,
  BarChart3,
  Wallet,
  CreditCard,
  Receipt,
  Percent,
  UserPlus,
  Trash2,
  Edit,
  PhoneCall,
  PhoneOutgoing,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────
interface ClientDetailProps {
  clientId: string;
}

// ═════════════════════════════════════════════════════════
// Main component
// ═════════════════════════════════════════════════════════

export function ClientDetail({ clientId }: ClientDetailProps) {
  const router = useRouter();

  // ─── Data hooks ─────────────────────────────────────
  const { data: client, isLoading: clientLoading } = useClient(clientId);
  const { data: leads = [] } = useLeadsByClient(clientId);
  const { data: calendarCalls = [] } = useCallCalendar({ clientId });
  const { data: closerCalls = [] } = useCloserCalls({ clientId });
  const { data: entries = [] } = useFinancialEntries({ clientId });
  const { data: financeStats } = useFinanceStats(clientId);
  const { data: assignments = [] } = useClientAssignments(clientId);

  // ─── Mutations ──────────────────────────────────────
  const updateClient = useUpdateClient();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const createCall = useCreateCall();
  const createCloserCall = useCreateCloserCall();
  const createFinancialEntry = useCreateFinancialEntry();
  const upsertAssignment = useUpsertAssignment();
  const deleteAssignment = useDeleteAssignment();

  // ─── Dialog states ──────────────────────────────────
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [closerCallDialogOpen, setCloserCallDialogOpen] = useState(false);
  const [financeDialogOpen, setFinanceDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // ─── Lead form ──────────────────────────────────────
  const [leadForm, setLeadForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    source: "instagram",
    estimated_value: 0,
    notes: "",
  });

  // ─── Call form ──────────────────────────────────────
  const [callForm, setCallForm] = useState({
    date: "",
    time: "",
    type: "manuel",
    status: "planifi\u00e9",
    notes: "",
  });

  // ─── Closer call form ──────────────────────────────
  const [closerCallForm, setCloserCallForm] = useState({
    date: "",
    status: "en_attente",
    revenue: 0,
    nombre_paiements: 1,
    notes: "",
    debrief: "",
  });

  // ─── Finance form ──────────────────────────────────
  const [financeForm, setFinanceForm] = useState({
    type: "ca",
    label: "",
    amount: 0,
    date: "",
    is_paid: false,
  });

  // ─── Assignment form ──────────────────────────────
  const [assignmentForm, setAssignmentForm] = useState({
    user_id: "",
    role: "manager",
  });

  // ─── Edit client form ─────────────────────────────
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    niche: "",
    status: "actif",
  });

  // ─── Derived KPIs ─────────────────────────────────
  const totalLeads = leads.length;
  const bookedCalls = leads.filter((l) => l.status === "appel_booke").length;
  const closedLeads = leads.filter((l) => l.status === "close").length;
  const closingRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;
  const totalCA = leads
    .filter((l) => l.status === "close")
    .reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  // ─── Handlers ─────────────────────────────────────

  const handleAddLead = async () => {
    try {
      await createLead.mutateAsync({
        ...leadForm,
        client_id: clientId,
        status: "nouveau",
        sort_order: 0,
      });
      setLeadDialogOpen(false);
      setLeadForm({ full_name: "", email: "", phone: "", source: "instagram", estimated_value: 0, notes: "" });
      toast.success("Lead ajout\u00e9");
    } catch {
      toast.error("Erreur lors de l'ajout du lead");
    }
  };

  const handleLeadStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateLead.mutateAsync({ id: leadId, status: newStatus as any });
      toast.success("Statut mis \u00e0 jour");
    } catch {
      toast.error("Erreur lors de la mise \u00e0 jour");
    }
  };

  const handleAddCall = async () => {
    try {
      await createCall.mutateAsync({
        ...callForm,
        client_id: clientId,
      } as any);
      setCallDialogOpen(false);
      setCallForm({ date: "", time: "", type: "manuel", status: "planifi\u00e9", notes: "" });
      toast.success("Appel ajout\u00e9");
    } catch {
      toast.error("Erreur lors de l'ajout de l'appel");
    }
  };

  const handleAddCloserCall = async () => {
    try {
      await createCloserCall.mutateAsync({
        ...closerCallForm,
        client_id: clientId,
      } as any);
      setCloserCallDialogOpen(false);
      setCloserCallForm({ date: "", status: "en_attente", revenue: 0, nombre_paiements: 1, notes: "", debrief: "" });
      toast.success("Appel closer ajout\u00e9");
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleAddFinancialEntry = async () => {
    try {
      await createFinancialEntry.mutateAsync({
        ...financeForm,
        client_id: clientId,
      } as any);
      setFinanceDialogOpen(false);
      setFinanceForm({ type: "ca", label: "", amount: 0, date: "", is_paid: false });
      toast.success("Entr\u00e9e financi\u00e8re ajout\u00e9e");
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleAddAssignment = async () => {
    if (!assignmentForm.user_id.trim()) return;
    try {
      await upsertAssignment.mutateAsync({
        client_id: clientId,
        user_id: assignmentForm.user_id,
        role: assignmentForm.role,
      });
      setAssignmentDialogOpen(false);
      setAssignmentForm({ user_id: "", role: "manager" });
      toast.success("Membre assign\u00e9");
    } catch {
      toast.error("Erreur lors de l'assignation");
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      await deleteAssignment.mutateAsync(assignmentId);
      toast.success("Membre retir\u00e9");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleEditClient = async () => {
    try {
      await updateClient.mutateAsync({
        id: clientId,
        name: editForm.name,
        email: editForm.email || null,
        phone: editForm.phone || null,
        niche: editForm.niche || null,
        status: editForm.status as any,
      });
      setEditDialogOpen(false);
      toast.success("Client mis \u00e0 jour");
    } catch {
      toast.error("Erreur lors de la mise \u00e0 jour");
    }
  };

  const openEditDialog = () => {
    if (client) {
      setEditForm({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        niche: client.niche || "",
        status: client.status || "actif",
      });
      setEditDialogOpen(true);
    }
  };

  // ─── Loading state ────────────────────────────────
  if (clientLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#C6FF00]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Client introuvable</p>
        <Button variant="outline" onClick={() => router.push("/admin/crm")}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/crm")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <Badge
              variant="outline"
              className={cn("text-xs", CLIENT_STATUS_COLORS[client.status] || "")}
            >
              {CLIENT_STATUS_LABELS[client.status] || client.status}
            </Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={openEditDialog}>
          <Edit className="h-4 w-4 mr-1" />
          Modifier
        </Button>
      </div>

      {/* ─── Tabs ──────────────────────────────────── */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-[#141414] border border-white/10">
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="calls">Appels</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
          <TabsTrigger value="team">\u00c9quipe</TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════ */}
        {/* TAB 1: Vue d'ensemble                      */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-6">
          {/* Client info card */}
          <Card className="bg-[#141414] border-white/10">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email :</span>
                    <span>{client.email || "\u2014"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">T\u00e9l\u00e9phone :</span>
                    <span>{client.phone || "\u2014"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Niche :</span>
                    <span>{client.niche || "\u2014"}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Business Manager :</span>
                    <span>{client.business_manager || "\u2014"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Cr\u00e9\u00e9 le :</span>
                    <span>{formatDate(client.created_at)}</span>
                  </div>
                  {client.notes && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0">Notes :</span>
                      <span className="text-muted-foreground italic">{client.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-[#141414] border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Target className="h-4 w-4" />
                  Total leads
                </div>
                <p className="text-2xl font-bold">{totalLeads}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#141414] border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <PhoneCall className="h-4 w-4" />
                  Appels book\u00e9s
                </div>
                <p className="text-2xl font-bold">{bookedCalls}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#141414] border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Percent className="h-4 w-4" />
                  Taux closing
                </div>
                <p className="text-2xl font-bold text-[#C6FF00]">{closingRate}%</p>
              </CardContent>
            </Card>
            <Card className="bg-[#141414] border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <DollarSign className="h-4 w-4" />
                  CA total
                </div>
                <p className="text-2xl font-bold text-emerald-400">
                  {totalCA.toLocaleString("fr-FR")} \u20ac
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Team assignments */}
          <Card className="bg-[#141414] border-white/10">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-[#C6FF00]" />
                \u00c9quipe assign\u00e9e
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun membre assign\u00e9</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {assignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10"
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={a.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-[#C6FF00]/20 text-[#C6FF00] text-xs">
                          {getInitials(a.profile?.full_name || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{a.profile?.full_name || "Inconnu"}</p>
                        <Badge variant="outline" className="text-[10px] mt-0.5">
                          {ASSIGNMENT_ROLE_LABELS[a.role] || a.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════ */}
        {/* TAB 2: Leads                               */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Leads ({leads.length})</h2>
            <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau lead</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom complet *</Label>
                    <Input
                      value={leadForm.full_name}
                      onChange={(e) => setLeadForm({ ...leadForm, full_name: e.target.value })}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                        placeholder="jean@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>T\u00e9l\u00e9phone</Label>
                      <Input
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                        placeholder="+33 6 ..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Source</Label>
                      <Select
                        value={leadForm.source}
                        onValueChange={(v) => setLeadForm({ ...leadForm, source: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_SOURCES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {LEAD_SOURCE_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valeur estim\u00e9e (\u20ac)</Label>
                      <Input
                        type="number"
                        value={leadForm.estimated_value}
                        onChange={(e) => setLeadForm({ ...leadForm, estimated_value: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={leadForm.notes}
                      onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                      placeholder="Informations compl\u00e9mentaires..."
                      className="min-h-[60px]"
                    />
                  </div>
                  <Button
                    className="w-full bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90"
                    onClick={handleAddLead}
                    disabled={!leadForm.full_name.trim() || createLead.isPending}
                  >
                    {createLead.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Ajouter
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Leads table */}
          <Card className="bg-[#141414] border-white/10">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3 text-muted-foreground font-medium">Nom</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Email</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Statut</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Valeur</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Source</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">
                          Aucun lead pour ce client
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead) => (
                        <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3 font-medium">{lead.full_name}</td>
                          <td className="p-3 text-muted-foreground">{lead.email || "\u2014"}</td>
                          <td className="p-3">
                            <Select
                              value={lead.status}
                              onValueChange={(v) => handleLeadStatusChange(lead.id, v)}
                            >
                              <SelectTrigger className="h-7 w-[130px] text-xs border-0 bg-transparent">
                                <Badge
                                  variant="outline"
                                  className={cn("text-[10px]", LEAD_STATUS_COLORS[lead.status] || "")}
                                >
                                  {LEAD_STATUS_LABELS[lead.status] || lead.status}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {LEAD_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {LEAD_STATUS_LABELS[s]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            {lead.estimated_value > 0
                              ? `${lead.estimated_value.toLocaleString("fr-FR")} \u20ac`
                              : "\u2014"}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {LEAD_SOURCE_LABELS[lead.source || ""] || lead.source || "\u2014"}
                          </td>
                          <td className="p-3 text-muted-foreground">{formatDate(lead.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════ */}
        {/* TAB 3: Appels                              */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="calls" className="space-y-6">
          {/* ─── Calendar Calls ────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-[#C6FF00]" />
                Appels calendrier ({calendarCalls.length})
              </h2>
              <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvel appel calendrier</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Date *</Label>
                        <Input
                          type="date"
                          value={callForm.date}
                          onChange={(e) => setCallForm({ ...callForm, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Heure</Label>
                        <Input
                          type="time"
                          value={callForm.time}
                          onChange={(e) => setCallForm({ ...callForm, time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={callForm.type}
                          onValueChange={(v) => setCallForm({ ...callForm, type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CALL_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {CALL_TYPE_LABELS[t]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <Select
                          value={callForm.status}
                          onValueChange={(v) => setCallForm({ ...callForm, status: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CALL_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {CALL_STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={callForm.notes}
                        onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                        placeholder="Notes sur l'appel..."
                        className="min-h-[60px]"
                      />
                    </div>
                    <Button
                      className="w-full bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90"
                      onClick={handleAddCall}
                      disabled={!callForm.date || createCall.isPending}
                    >
                      {createCall.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Ajouter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="bg-[#141414] border-white/10">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Heure</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Type</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Statut</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Assign\u00e9 \u00e0</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calendarCalls.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-muted-foreground">
                            Aucun appel calendrier
                          </td>
                        </tr>
                      ) : (
                        calendarCalls.map((call: any) => (
                          <tr key={call.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-3">{formatDate(call.date)}</td>
                            <td className="p-3 text-muted-foreground">{call.time || "\u2014"}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-[10px]">
                                {CALL_TYPE_LABELS[call.type] || call.type}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-[10px]">
                                {CALL_STATUS_LABELS[call.status] || call.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {call.assignee?.full_name || "\u2014"}
                            </td>
                            <td className="p-3 text-muted-foreground truncate max-w-[200px]">
                              {call.notes || "\u2014"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Closer Calls ─────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <PhoneOutgoing className="h-5 w-5 text-emerald-400" />
                Appels closer ({closerCalls.length})
              </h2>
              <Dialog open={closerCallDialogOpen} onOpenChange={setCloserCallDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvel appel closer</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Date *</Label>
                        <Input
                          type="date"
                          value={closerCallForm.date}
                          onChange={(e) => setCloserCallForm({ ...closerCallForm, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <Select
                          value={closerCallForm.status}
                          onValueChange={(v) => setCloserCallForm({ ...closerCallForm, status: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CLOSER_CALL_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {CLOSER_CALL_STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Revenu (\u20ac)</Label>
                        <Input
                          type="number"
                          value={closerCallForm.revenue}
                          onChange={(e) => setCloserCallForm({ ...closerCallForm, revenue: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nombre de paiements</Label>
                        <Input
                          type="number"
                          min={1}
                          value={closerCallForm.nombre_paiements}
                          onChange={(e) => setCloserCallForm({ ...closerCallForm, nombre_paiements: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>D\u00e9brief</Label>
                      <Textarea
                        value={closerCallForm.debrief}
                        onChange={(e) => setCloserCallForm({ ...closerCallForm, debrief: e.target.value })}
                        placeholder="D\u00e9brief de l'appel..."
                        className="min-h-[60px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={closerCallForm.notes}
                        onChange={(e) => setCloserCallForm({ ...closerCallForm, notes: e.target.value })}
                        placeholder="Notes compl\u00e9mentaires..."
                        className="min-h-[60px]"
                      />
                    </div>
                    <Button
                      className="w-full bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90"
                      onClick={handleAddCloserCall}
                      disabled={!closerCallForm.date || createCloserCall.isPending}
                    >
                      {createCloserCall.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Ajouter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="bg-[#141414] border-white/10">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Statut</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Closer</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Lead</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Revenu</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {closerCalls.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-muted-foreground">
                            Aucun appel closer
                          </td>
                        </tr>
                      ) : (
                        closerCalls.map((call: any) => (
                          <tr key={call.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-3">{formatDate(call.date)}</td>
                            <td className="p-3">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px]",
                                  CLOSER_CALL_STATUS_COLORS[call.status] || ""
                                )}
                              >
                                {CLOSER_CALL_STATUS_LABELS[call.status] || call.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {call.closer?.full_name || "\u2014"}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {call.lead?.full_name || "\u2014"}
                            </td>
                            <td className="p-3 font-medium">
                              {call.revenue > 0
                                ? `${Number(call.revenue).toLocaleString("fr-FR")} \u20ac`
                                : "\u2014"}
                            </td>
                            <td className="p-3 text-muted-foreground truncate max-w-[200px]">
                              {call.notes || call.debrief || "\u2014"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════ */}
        {/* TAB 4: Finances                            */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="finances" className="space-y-6">
          {/* Finance KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-[#141414] border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <BarChart3 className="h-4 w-4" />
                  CA total
                </div>
                <p className="text-2xl font-bold text-emerald-400">
                  {(financeStats?.total_ca || 0).toLocaleString("fr-FR")} \u20ac
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#141414] border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Receipt className="h-4 w-4" />
                  Charges
                </div>
                <p className="text-2xl font-bold text-red-400">
                  {(financeStats?.total_charges || 0).toLocaleString("fr-FR")} \u20ac
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#141414] border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Marge
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  (financeStats?.margin || 0) >= 0 ? "text-[#C6FF00]" : "text-red-400"
                )}>
                  {(financeStats?.margin || 0).toLocaleString("fr-FR")} \u20ac
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#141414] border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Wallet className="h-4 w-4" />
                  CA encaiss\u00e9
                </div>
                <p className="text-2xl font-bold text-blue-400">
                  {(financeStats?.ca_encaisse || 0).toLocaleString("fr-FR")} \u20ac
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Financial entries table */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Entr\u00e9es financi\u00e8res ({entries.length})</h2>
            <Dialog open={financeDialogOpen} onOpenChange={setFinanceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle entr\u00e9e financi\u00e8re</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={financeForm.type}
                        onValueChange={(v) => setFinanceForm({ ...financeForm, type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FINANCIAL_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {FINANCIAL_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={financeForm.date}
                        onChange={(e) => setFinanceForm({ ...financeForm, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Libell\u00e9 *</Label>
                    <Input
                      value={financeForm.label}
                      onChange={(e) => setFinanceForm({ ...financeForm, label: e.target.value })}
                      placeholder="Description de l'entr\u00e9e..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Montant (\u20ac) *</Label>
                      <Input
                        type="number"
                        value={financeForm.amount}
                        onChange={(e) => setFinanceForm({ ...financeForm, amount: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pay\u00e9 ?</Label>
                      <Select
                        value={financeForm.is_paid ? "true" : "false"}
                        onValueChange={(v) => setFinanceForm({ ...financeForm, is_paid: v === "true" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Oui</SelectItem>
                          <SelectItem value="false">Non</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90"
                    onClick={handleAddFinancialEntry}
                    disabled={!financeForm.label.trim() || !financeForm.date || createFinancialEntry.isPending}
                  >
                    {createFinancialEntry.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Ajouter
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-[#141414] border-white/10">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Type</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Libell\u00e9</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Montant</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Pay\u00e9</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-muted-foreground">
                          Aucune entr\u00e9e financi\u00e8re
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => (
                        <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3">{formatDate(entry.date)}</td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                FINANCIAL_TYPE_COLORS[entry.type] || ""
                              )}
                            >
                              {FINANCIAL_TYPE_LABELS[entry.type] || entry.type}
                            </Badge>
                          </td>
                          <td className="p-3">{entry.label}</td>
                          <td className="p-3 font-medium">
                            {Number(entry.amount).toLocaleString("fr-FR")} \u20ac
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                entry.is_paid
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-amber-500/20 text-amber-400"
                              )}
                            >
                              {entry.is_paid ? "Pay\u00e9" : "En attente"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════ */}
        {/* TAB 5: \u00c9quipe                              */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="team" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-[#C6FF00]" />
              \u00c9quipe assign\u00e9e ({assignments.length})
            </h2>
            <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Assigner un membre
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assigner un membre</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>ID utilisateur *</Label>
                    <Input
                      value={assignmentForm.user_id}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, user_id: e.target.value })}
                      placeholder="UUID de l'utilisateur"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>R\u00f4le</Label>
                    <Select
                      value={assignmentForm.role}
                      onValueChange={(v) => setAssignmentForm({ ...assignmentForm, role: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNMENT_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ASSIGNMENT_ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90"
                    onClick={handleAddAssignment}
                    disabled={!assignmentForm.user_id.trim() || upsertAssignment.isPending}
                  >
                    {upsertAssignment.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Assigner
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {assignments.length === 0 ? (
            <Card className="bg-[#141414] border-white/10">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Aucun membre assign\u00e9 \u00e0 ce client</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Utilisez le bouton ci-dessus pour assigner des membres de l&apos;\u00e9quipe.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((assignment) => {
                const roleColors: Record<string, string> = {
                  manager: "bg-purple-500/20 text-purple-400 border-purple-500/30",
                  coach: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                  setter: "bg-amber-500/20 text-amber-400 border-amber-500/30",
                  closer: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                  cm: "bg-pink-500/20 text-pink-400 border-pink-500/30",
                  monteur: "bg-orange-500/20 text-orange-400 border-orange-500/30",
                };

                return (
                  <Card key={assignment.id} className="bg-[#141414] border-white/10">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={assignment.profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-[#C6FF00]/20 text-[#C6FF00] text-sm">
                              {getInitials(assignment.profile?.full_name || "?")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {assignment.profile?.full_name || "Inconnu"}
                            </p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] mt-1",
                                roleColors[assignment.role] || "bg-zinc-500/20 text-zinc-400"
                              )}
                            >
                              {ASSIGNMENT_ROLE_LABELS[assignment.role] || assignment.role}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-400"
                          onClick={() => handleRemoveAssignment(assignment.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Assign\u00e9 le {formatDate(assignment.assigned_at)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════ */}
      {/* Edit Client Dialog                             */}
      {/* ═══════════════════════════════════════════════ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>T\u00e9l\u00e9phone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Niche</Label>
                <Input
                  value={editForm.niche}
                  onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90"
              onClick={handleEditClient}
              disabled={!editForm.name.trim() || updateClient.isPending}
            >
              {updateClient.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
