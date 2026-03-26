"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/dates";
import { getInitials } from "@/lib/utils/formatters";

import { useClient, useClientAssignments, useUpdateClient, useUpsertAssignment, useDeleteAssignment } from "@/lib/hooks/use-clients";
import { useLeadsByClient, useCreateLead, useUpdateLead, useLeadStats } from "@/lib/hooks/use-leads";
import { useCallCalendar, useCreateCall, useUpdateCall } from "@/lib/hooks/use-call-calendar";
import { useCloserCalls, useCreateCloserCall, useUpdateCloserCall, useCloserCallStats } from "@/lib/hooks/use-closer-calls";
import { useFinancialEntries, useFinanceStats, useCreateFinancialEntry } from "@/lib/hooks/use-finances";
import { usePipelineColumns } from "@/lib/hooks/use-pipeline";

import type { Lead, CallCalendarEntry, CloserCall, FinancialEntry, ClientStatus } from "@/lib/types/database";
import {
  CLIENT_STATUSES, CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS,
  LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS,
  CLIENT_SCOPE_STATUS_LABELS,
  LEAD_SOURCES, LEAD_SOURCE_LABELS, LEAD_SOURCE_COLORS,
  CALL_TYPES, CALL_TYPE_LABELS, CALL_STATUSES, CALL_STATUS_LABELS, CALL_STATUS_COLORS,
  CLOSER_CALL_STATUSES, CLOSER_CALL_STATUS_LABELS, CLOSER_CALL_STATUS_COLORS,
  FINANCIAL_TYPES, FINANCIAL_TYPE_LABELS, FINANCIAL_TYPE_COLORS,
  FINANCIAL_SUB_TYPES, FINANCIAL_SUB_TYPE_LABELS,
  ASSIGNMENT_ROLES, ASSIGNMENT_ROLE_LABELS,
} from "@/lib/constants/crm";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import {
  ChevronLeft, Users, TrendingUp, Phone, DollarSign, Plus, Loader2, Mail, Globe,
  UserCircle, Calendar, Target, BarChart3, Wallet, Percent, Trash2, Edit, PhoneCall,
} from "lucide-react";

export function ClientDetail({ clientId }: { clientId: string }) {
  const router = useRouter();

  const { data: client, isLoading } = useClient(clientId);
  const { data: leads = [] } = useLeadsByClient(clientId);
  const { data: leadStats } = useLeadStats(clientId);
  const { data: calendarCalls = [] } = useCallCalendar({ clientId });
  const { data: closerCalls = [] } = useCloserCalls({ clientId });
  const { data: closerStats } = useCloserCallStats({ clientId });
  const { data: entries = [] } = useFinancialEntries({ clientId });
  const { data: financeStats } = useFinanceStats(clientId);
  const { data: assignments = [] } = useClientAssignments(clientId);

  const updateClient = useUpdateClient();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const createCall = useCreateCall();
  const updateCall = useUpdateCall();
  const createCloserCall = useCreateCloserCall();
  const updateCloserCall = useUpdateCloserCall();
  const createFinancialEntry = useCreateFinancialEntry();
  const upsertAssignment = useUpsertAssignment();
  const deleteAssignment = useDeleteAssignment();

  // Dialog states
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [closerCallDialogOpen, setCloserCallDialogOpen] = useState(false);
  const [financeDialogOpen, setFinanceDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Forms
  const [leadForm, setLeadForm] = useState({ full_name: "", email: "", phone: "", source: "instagram", ca_contracte: 0, notes: "" });
  const [callForm, setCallForm] = useState({ date: "", time: "", type: "manuel", status: "planifié", notes: "" });
  const [closerCallForm, setCloserCallForm] = useState({ date: "", status: "non_categorise", revenue: 0, nombre_paiements: 1, debrief: "", notes: "" });
  const [financeForm, setFinanceForm] = useState({ type: "ca", sub_type: "", label: "", amount: 0, date: "", is_paid: false });
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", niche: "", status: "actif" });

  // KPIs
  const totalCA = leadStats?.ca_contracte || 0;
  const closingRate = closerStats?.taux_closing || 0;

  // Handlers
  const handleAddLead = async () => {
    if (!leadForm.full_name.trim()) return;
    try {
      await createLead.mutateAsync({ ...leadForm, client_id: clientId, status: "à_relancer", client_status: "contacté" } as Partial<Lead>);
      setLeadDialogOpen(false);
      setLeadForm({ full_name: "", email: "", phone: "", source: "instagram", ca_contracte: 0, notes: "" });
    } catch { /* toast handled */ }
  };

  const handleAddCall = async () => {
    if (!callForm.date) return;
    try {
      await createCall.mutateAsync({ ...callForm, client_id: clientId } as Partial<CallCalendarEntry>);
      setCallDialogOpen(false);
      setCallForm({ date: "", time: "", type: "manuel", status: "planifié", notes: "" });
    } catch { /* toast handled */ }
  };

  const handleAddCloserCall = async () => {
    if (!closerCallForm.date) return;
    try {
      await createCloserCall.mutateAsync({ ...closerCallForm, client_id: clientId } as Partial<CloserCall>);
      setCloserCallDialogOpen(false);
      setCloserCallForm({ date: "", status: "non_categorise", revenue: 0, nombre_paiements: 1, debrief: "", notes: "" });
    } catch { /* toast handled */ }
  };

  const handleAddFinance = async () => {
    if (!financeForm.label || !financeForm.amount) return;
    try {
      await createFinancialEntry.mutateAsync({
        ...financeForm,
        client_id: clientId,
        sub_type: financeForm.sub_type || null,
      } as Partial<FinancialEntry>);
      setFinanceDialogOpen(false);
      setFinanceForm({ type: "ca", sub_type: "", label: "", amount: 0, date: "", is_paid: false });
    } catch { /* toast handled */ }
  };

  const handleEditClient = async () => {
    try {
      await updateClient.mutateAsync({ id: clientId, name: editForm.name, email: editForm.email || null, phone: editForm.phone || null, niche: editForm.niche || null, status: editForm.status as ClientStatus });
      setEditDialogOpen(false);
    } catch { /* toast handled */ }
  };

  const openEditDialog = () => {
    if (!client) return;
    setEditForm({ name: client.name, email: client.email || "", phone: client.phone || "", niche: client.niche || "", status: client.status });
    setEditDialogOpen(true);
  };

  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-[#C6FF00]" /></div>;
  if (!client) return <div className="flex flex-col items-center justify-center h-96 gap-4"><p className="text-muted-foreground">Client introuvable</p><Button variant="outline" onClick={() => router.push("/admin/crm")}><ChevronLeft className="h-4 w-4 mr-1" />Retour</Button></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/crm")} className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4 mr-1" />Retour</Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <Badge variant="outline" className={cn("text-xs", CLIENT_STATUS_COLORS[client.status])}>{CLIENT_STATUS_LABELS[client.status]}</Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={openEditDialog}><Edit className="h-4 w-4 mr-1" />Modifier</Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-[#141414] border border-white/10">
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="calls">Appels</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
          <TabsTrigger value="team">Équipe</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-[#141414] border-white/10"><CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Email :</span><span>{client.email || "—"}</span></div>
                <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Téléphone :</span><span>{client.phone || "—"}</span></div>
                <div className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Niche :</span><span>{client.niche || "—"}</span></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm"><UserCircle className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Manager :</span><span>{client.business_manager || "—"}</span></div>
                <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Créé le :</span><span>{formatDate(client.created_at)}</span></div>
                {client.notes && <div className="flex items-start gap-2 text-sm"><span className="text-muted-foreground shrink-0">Notes :</span><span className="italic text-muted-foreground">{client.notes}</span></div>}
              </div>
            </div>
          </CardContent></Card>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MiniKPI label="Total leads" value={leadStats?.total || 0} />
            <MiniKPI label="À relancer" value={leadStats?.a_relancer || 0} color="text-amber-400" />
            <MiniKPI label="Bookés" value={leadStats?.booke || 0} color="text-blue-400" />
            <MiniKPI label="Taux closing" value={`${closingRate}%`} color="text-[#C6FF00]" />
            <MiniKPI label="CA contracté" value={`${totalCA.toLocaleString("fr-FR")} €`} color="text-emerald-400" />
          </div>

          {assignments.length > 0 && (
            <Card className="bg-[#141414] border-white/10"><CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-[#C6FF00]" />Équipe assignée</CardTitle></CardHeader><CardContent>
              <div className="flex flex-wrap gap-3">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                    <Avatar className="h-7 w-7"><AvatarImage src={a.profile?.avatar_url || undefined} /><AvatarFallback className="bg-[#C6FF00]/20 text-[#C6FF00] text-xs">{getInitials(a.profile?.full_name || "?")}</AvatarFallback></Avatar>
                    <div><p className="text-sm font-medium leading-none">{a.profile?.full_name || "Inconnu"}</p><Badge variant="outline" className="text-[10px] mt-0.5">{ASSIGNMENT_ROLE_LABELS[a.role] || a.role}</Badge></div>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* LEADS */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Leads ({leads.length})</h2>
            <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
              <DialogTrigger asChild><Button size="sm" className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90"><Plus className="h-4 w-4 mr-1" />Ajouter</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Nouveau lead</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Nom *</Label><Input value={leadForm.full_name} onChange={(e) => setLeadForm({ ...leadForm, full_name: e.target.value })} placeholder="Jean Dupont" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Téléphone</Label><Input value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Source</Label><Select value={leadForm.source} onValueChange={(v) => setLeadForm({ ...leadForm, source: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>CA contracté (€)</Label><Input type="number" value={leadForm.ca_contracte || ""} onChange={(e) => setLeadForm({ ...leadForm, ca_contracte: Number(e.target.value) })} /></div>
                  </div>
                  <Button className="w-full bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90" onClick={handleAddLead} disabled={!leadForm.full_name.trim() || createLead.isPending}>{createLead.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}Ajouter</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-[#141414] border-white/10"><CardContent className="p-0"><div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10">
                <th className="text-left p-3 text-muted-foreground font-medium">Nom</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Pipeline</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Statut</th>
                <th className="text-left p-3 text-muted-foreground font-medium">CA</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Source</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
              </tr></thead>
              <tbody>
                {leads.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Aucun lead</td></tr> : leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium">{lead.full_name}</td>
                    <td className="p-3"><Badge variant="outline" className="text-[10px]">{CLIENT_SCOPE_STATUS_LABELS[lead.client_status]}</Badge></td>
                    <td className="p-3"><Badge variant="outline" className={cn("text-[10px]", LEAD_STATUS_COLORS[lead.status])}>{LEAD_STATUS_LABELS[lead.status]}</Badge></td>
                    <td className="p-3">{lead.ca_contracte > 0 ? `${lead.ca_contracte.toLocaleString("fr-FR")} €` : "—"}</td>
                    <td className="p-3">{lead.source ? <Badge variant="outline" className={cn("text-[9px] border-0", LEAD_SOURCE_COLORS[lead.source])}>{LEAD_SOURCE_LABELS[lead.source]}</Badge> : "—"}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(lead.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></CardContent></Card>
        </TabsContent>

        {/* CALLS */}
        <TabsContent value="calls" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2"><PhoneCall className="h-5 w-5 text-[#C6FF00]" />Appels ({calendarCalls.length})</h2>
            <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
              <DialogTrigger asChild><Button size="sm" className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90"><Plus className="h-4 w-4 mr-1" />Ajouter</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Nouvel appel</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Date *</Label><Input type="date" value={callForm.date} onChange={(e) => setCallForm({ ...callForm, date: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Heure</Label><Input type="time" value={callForm.time} onChange={(e) => setCallForm({ ...callForm, time: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Type</Label><Select value={callForm.type} onValueChange={(v) => setCallForm({ ...callForm, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CALL_TYPES.map((t) => <SelectItem key={t} value={t}>{CALL_TYPE_LABELS[t]}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Statut</Label><Select value={callForm.status} onValueChange={(v) => setCallForm({ ...callForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{CALL_STATUS_LABELS[s]}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                  <Button className="w-full bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90" onClick={handleAddCall} disabled={!callForm.date || createCall.isPending}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="bg-[#141414] border-white/10"><CardContent className="p-0"><div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10">
                <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Heure</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Type</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Statut</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Lead</th>
              </tr></thead>
              <tbody>
                {calendarCalls.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Aucun appel</td></tr> : calendarCalls.map((call) => (
                  <tr key={call.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3">{formatDate(call.date)}</td>
                    <td className="p-3 text-muted-foreground">{call.time?.slice(0, 5) || "—"}</td>
                    <td className="p-3"><Badge variant="outline" className="text-[10px]">{CALL_TYPE_LABELS[call.type]}</Badge></td>
                    <td className="p-3">
                      <Select value={call.status} onValueChange={(v) => updateCall.mutate({ id: call.id, status: v as CallCalendarEntry["status"] })}>
                        <SelectTrigger className="h-7 w-[120px] text-xs border-0 bg-transparent"><Badge variant="outline" className={cn("text-[10px]", CALL_STATUS_COLORS[call.status])}>{CALL_STATUS_LABELS[call.status]}</Badge></SelectTrigger>
                        <SelectContent>{CALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{CALL_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 text-muted-foreground">{call.lead?.full_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></CardContent></Card>

          {/* Closer Calls */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-400" />Closer calls ({closerCalls.length})</h2>
            <Dialog open={closerCallDialogOpen} onOpenChange={setCloserCallDialogOpen}>
              <DialogTrigger asChild><Button size="sm" className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90"><Plus className="h-4 w-4 mr-1" />Ajouter</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Nouveau closer call</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Date *</Label><Input type="date" value={closerCallForm.date} onChange={(e) => setCloserCallForm({ ...closerCallForm, date: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Revenue (€)</Label><Input type="number" value={closerCallForm.revenue || ""} onChange={(e) => setCloserCallForm({ ...closerCallForm, revenue: Number(e.target.value) })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Statut</Label><Select value={closerCallForm.status} onValueChange={(v) => setCloserCallForm({ ...closerCallForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CLOSER_CALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{CLOSER_CALL_STATUS_LABELS[s]}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Nb paiements</Label><Input type="number" value={closerCallForm.nombre_paiements} onChange={(e) => setCloserCallForm({ ...closerCallForm, nombre_paiements: Number(e.target.value) })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Debrief</Label><Input value={closerCallForm.debrief} onChange={(e) => setCloserCallForm({ ...closerCallForm, debrief: e.target.value })} placeholder="Debrief de l'appel..." /></div>
                  <Button className="w-full bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90" onClick={handleAddCloserCall} disabled={!closerCallForm.date || createCloserCall.isPending}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {closerStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MiniKPI label="Total calls" value={closerStats.total} />
              <MiniKPI label="Closés" value={closerStats.closed} color="text-emerald-400" />
              <MiniKPI label="CA total" value={`${closerStats.ca_total.toLocaleString("fr-FR")} €`} color="text-[#C6FF00]" />
              <MiniKPI label="Taux closing" value={`${closerStats.taux_closing}%`} color="text-blue-400" />
            </div>
          )}
          <Card className="bg-[#141414] border-white/10"><CardContent className="p-0"><div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10">
                <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Lead</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Statut</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Revenue</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Debrief</th>
              </tr></thead>
              <tbody>
                {closerCalls.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Aucun closer call</td></tr> : closerCalls.map((call) => (
                  <tr key={call.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3">{formatDate(call.date)}</td>
                    <td className="p-3">{call.lead?.full_name || call.prospect_name || "—"}</td>
                    <td className="p-3">
                      <Select value={call.status} onValueChange={(v) => updateCloserCall.mutate({ id: call.id, status: v as CloserCall["status"] })}>
                        <SelectTrigger className="h-7 w-[140px] text-xs border-0 bg-transparent"><Badge variant="outline" className={cn("text-[10px]", CLOSER_CALL_STATUS_COLORS[call.status])}>{CLOSER_CALL_STATUS_LABELS[call.status]}</Badge></SelectTrigger>
                        <SelectContent>{CLOSER_CALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{CLOSER_CALL_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 font-medium">{call.revenue > 0 ? `${Number(call.revenue).toLocaleString("fr-FR")} €` : "—"}</td>
                    <td className="p-3 text-muted-foreground truncate max-w-[200px]">{call.debrief || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></CardContent></Card>
        </TabsContent>

        {/* FINANCES */}
        <TabsContent value="finances" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Finances</h2>
            <Dialog open={financeDialogOpen} onOpenChange={setFinanceDialogOpen}>
              <DialogTrigger asChild><Button size="sm" className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90"><Plus className="h-4 w-4 mr-1" />Ajouter</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Nouvelle entrée</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Type</Label><Select value={financeForm.type} onValueChange={(v) => setFinanceForm({ ...financeForm, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FINANCIAL_TYPES.map((t) => <SelectItem key={t} value={t}>{FINANCIAL_TYPE_LABELS[t]}</SelectItem>)}</SelectContent></Select></div>
                    {financeForm.type === "ca" && <div className="space-y-2"><Label>Sous-type</Label><Select value={financeForm.sub_type || "none"} onValueChange={(v) => setFinanceForm({ ...financeForm, sub_type: v === "none" ? "" : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Aucun</SelectItem>{FINANCIAL_SUB_TYPES.map((t) => <SelectItem key={t} value={t}>{FINANCIAL_SUB_TYPE_LABELS[t]}</SelectItem>)}</SelectContent></Select></div>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Label *</Label><Input value={financeForm.label} onChange={(e) => setFinanceForm({ ...financeForm, label: e.target.value })} placeholder="Description..." /></div>
                    <div className="space-y-2"><Label>Montant (€) *</Label><Input type="number" value={financeForm.amount || ""} onChange={(e) => setFinanceForm({ ...financeForm, amount: Number(e.target.value) })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Date</Label><Input type="date" value={financeForm.date} onChange={(e) => setFinanceForm({ ...financeForm, date: e.target.value })} /></div>
                    <div className="space-y-2 flex items-end"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={financeForm.is_paid} onChange={(e) => setFinanceForm({ ...financeForm, is_paid: e.target.checked })} className="rounded" /><span className="text-sm">Payé</span></label></div>
                  </div>
                  <Button className="w-full bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90" onClick={handleAddFinance} disabled={!financeForm.label || !financeForm.amount || createFinancialEntry.isPending}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {financeStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MiniKPI label="CA total" value={`${financeStats.revenue.toLocaleString("fr-FR")} €`} color="text-emerald-400" />
              <MiniKPI label="Encaissé" value={`${financeStats.ca_encaisse.toLocaleString("fr-FR")} €`} color="text-[#C6FF00]" />
              <MiniKPI label="Charges" value={`${financeStats.expenses.toLocaleString("fr-FR")} €`} color="text-red-400" />
              <MiniKPI label="Marge" value={`${financeStats.margin.toLocaleString("fr-FR")} €`} color={financeStats.margin >= 0 ? "text-emerald-400" : "text-red-400"} />
            </div>
          )}

          <Card className="bg-[#141414] border-white/10"><CardContent className="p-0"><div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10">
                <th className="text-left p-3 text-muted-foreground font-medium">Label</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Type</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Montant</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Payé</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
              </tr></thead>
              <tbody>
                {entries.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Aucune entrée</td></tr> : entries.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3"><div><p className="font-medium">{e.label || "—"}</p>{e.sub_type && <p className="text-[10px] text-muted-foreground">{FINANCIAL_SUB_TYPE_LABELS[e.sub_type] || e.sub_type}</p>}</div></td>
                    <td className="p-3"><Badge variant="outline" className={cn("text-[10px] border-0", FINANCIAL_TYPE_COLORS[e.type])}>{FINANCIAL_TYPE_LABELS[e.type]}</Badge></td>
                    <td className="p-3 font-mono font-medium">{Number(e.amount).toLocaleString("fr-FR")} €</td>
                    <td className="p-3">{e.is_paid ? <span className="text-emerald-400">✓</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(e.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></CardContent></Card>
        </TabsContent>

        {/* TEAM */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Équipe ({assignments.length})</h2>
          </div>
          {assignments.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Aucun membre assigné</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((a) => (
                <Card key={a.id} className="bg-[#141414] border-white/10">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10"><AvatarImage src={a.profile?.avatar_url || undefined} /><AvatarFallback className="bg-[#C6FF00]/20 text-[#C6FF00]">{getInitials(a.profile?.full_name || "?")}</AvatarFallback></Avatar>
                      <div><p className="font-medium">{a.profile?.full_name || "Inconnu"}</p><Badge variant="outline" className="text-[10px]">{ASSIGNMENT_ROLE_LABELS[a.role] || a.role}</Badge></div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={() => deleteAssignment.mutate(a.id)}><Trash2 className="h-4 w-4" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Client Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Modifier le client</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nom *</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Téléphone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Niche</Label><Input value={editForm.niche} onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })} /></div>
              <div className="space-y-2"><Label>Statut</Label><Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CLIENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{CLIENT_STATUS_LABELS[s]}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <Button className="w-full bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90" onClick={handleEditClient} disabled={updateClient.isPending}>{updateClient.isPending ? "Enregistrement..." : "Mettre à jour"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniKPI({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return <Card className="bg-[#141414] border-white/10"><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">{label}</p><p className={cn("text-xl font-bold", color)}>{value}</p></CardContent></Card>;
}
