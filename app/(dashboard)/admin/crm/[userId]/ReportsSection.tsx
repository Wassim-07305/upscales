"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  FileBarChart,
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  Trash2,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { logSupabaseError } from "@/lib/error-logger";
import { formatDate } from "@/lib/utils/dates";
import type { ClientReport, ReportType, ReportMetrics } from "@/lib/types/database";

interface ReportsSectionProps {
  clientId: string;
  userId: string;
  reports: ClientReport[];
}

export function ReportsSection({ clientId, userId, reports: initial }: ReportsSectionProps) {
  const supabase = createClient();
  const [reports, setReports] = useState<ClientReport[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form
  const [reportType, setReportType] = useState<ReportType>("weekly");
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [npsScore, setNpsScore] = useState("");
  const [leads, setLeads] = useState("");
  const [appelsBookes, setAppelsBookes] = useState("");
  const [showUpPct, setShowUpPct] = useState("");
  const [closes, setCloses] = useState("");
  const [depensePub, setDepensePub] = useState("");
  const [cpa, setCpa] = useState("");
  const [caMensuel, setCaMensuel] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [actions, setActions] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setReportType("weekly");
    setNpsScore("");
    setLeads(""); setAppelsBookes(""); setShowUpPct("");
    setCloses(""); setDepensePub(""); setCpa(""); setCaMensuel("");
    setDiagnostic(""); setActions(""); setNotes("");
  };

  const handleCreate = async () => {
    setSaving(true);
    const metrics: ReportMetrics = {};
    if (leads) metrics.leads = parseInt(leads);
    if (appelsBookes) metrics.appels_bookes = parseInt(appelsBookes);
    if (showUpPct) metrics.show_up_pct = parseFloat(showUpPct);
    if (closes) metrics.closes = parseInt(closes);
    if (depensePub) metrics.depense_pub = parseFloat(depensePub);
    if (cpa) metrics.cpa = parseFloat(cpa);
    if (caMensuel) metrics.ca_mensuel = parseFloat(caMensuel);

    const { data, error } = await supabase
      .from("client_reports")
      .insert({
        client_id: clientId,
        author_id: userId,
        report_type: reportType,
        period_start: periodStart,
        period_end: periodEnd,
        nps_score: npsScore ? parseInt(npsScore) : null,
        metrics,
        diagnostic: diagnostic || null,
        actions: actions || null,
        notes: notes || null,
      })
      .select("*")
      .single();

    if (error) {
      logSupabaseError("create report", error);
      toast.error("Erreur de création");
    } else {
      setReports((prev) => [data, ...prev]);
      toast.success("Rapport créé");
      resetForm();
      setShowAdd(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce rapport ?")) return;
    const { error } = await supabase.from("client_reports").delete().eq("id", id);
    if (error) {
      logSupabaseError("delete report", error);
      toast.error("Erreur de suppression");
    } else {
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success("Rapport supprimé");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileBarChart className="h-5 w-5 text-neon" />
            Rapports client
            <Badge variant="outline" className="text-xs ml-1">{reports.length}</Badge>
          </CardTitle>
          <Button onClick={() => setShowAdd(true)} size="sm" className="bg-neon text-black hover:bg-neon/90">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau rapport
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun rapport pour ce client.</p>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => {
              const isExpanded = expandedId === report.id;
              const m = (report.metrics || {}) as ReportMetrics;

              return (
                <div key={report.id} className="border border-border rounded-lg overflow-hidden">
                  {/* Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <Badge variant="outline" className={cn("text-[10px]", report.report_type === "monthly" ? "bg-purple-400/20 text-purple-400" : "bg-blue-400/20 text-blue-400")}>
                        {report.report_type === "monthly" ? "Mensuel" : "Hebdo"}
                      </Badge>
                      <span className="text-sm">
                        {formatDate(report.period_start)} → {formatDate(report.period_end)}
                      </span>
                      {report.nps_score != null && (
                        <span className={cn("text-xs font-semibold", report.nps_score >= 9 ? "text-emerald-400" : report.nps_score >= 7 ? "text-yellow-400" : "text-red-400")}>
                          NPS {report.nps_score}/10
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {report.author?.full_name}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }}
                        className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Detail */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 space-y-3 border-t border-border">
                      {/* Metrics grid */}
                      {Object.keys(m).length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {m.leads != null && (
                            <div className="p-2 rounded bg-white/5 text-center">
                              <p className="text-[10px] text-muted-foreground">Leads</p>
                              <p className="text-sm font-semibold">{m.leads}</p>
                            </div>
                          )}
                          {m.appels_bookes != null && (
                            <div className="p-2 rounded bg-white/5 text-center">
                              <p className="text-[10px] text-muted-foreground">Appels bookés</p>
                              <p className="text-sm font-semibold">{m.appels_bookes}</p>
                            </div>
                          )}
                          {m.show_up_pct != null && (
                            <div className="p-2 rounded bg-white/5 text-center">
                              <p className="text-[10px] text-muted-foreground">Show-up</p>
                              <p className="text-sm font-semibold">{m.show_up_pct}%</p>
                            </div>
                          )}
                          {m.closes != null && (
                            <div className="p-2 rounded bg-white/5 text-center">
                              <p className="text-[10px] text-muted-foreground">Closes</p>
                              <p className="text-sm font-semibold">{m.closes}</p>
                            </div>
                          )}
                          {m.depense_pub != null && (
                            <div className="p-2 rounded bg-white/5 text-center">
                              <p className="text-[10px] text-muted-foreground">Dépense pub</p>
                              <p className="text-sm font-semibold">{m.depense_pub} €</p>
                            </div>
                          )}
                          {m.cpa != null && (
                            <div className="p-2 rounded bg-white/5 text-center">
                              <p className="text-[10px] text-muted-foreground">CPA</p>
                              <p className="text-sm font-semibold">{m.cpa} €</p>
                            </div>
                          )}
                          {m.ca_mensuel != null && (
                            <div className="p-2 rounded bg-white/5 text-center">
                              <p className="text-[10px] text-muted-foreground">CA mensuel</p>
                              <p className="text-sm font-semibold">{m.ca_mensuel} €</p>
                            </div>
                          )}
                        </div>
                      )}

                      {report.diagnostic && (
                        <div>
                          <p className="text-[11px] font-medium text-muted-foreground mb-1">Diagnostic</p>
                          <p className="text-sm whitespace-pre-wrap">{report.diagnostic}</p>
                        </div>
                      )}
                      {report.actions && (
                        <div>
                          <p className="text-[11px] font-medium text-muted-foreground mb-1">Actions</p>
                          <p className="text-sm whitespace-pre-wrap">{report.actions}</p>
                        </div>
                      )}
                      {report.notes && (
                        <div>
                          <p className="text-[11px] font-medium text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Report Modal */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau rapport</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Type + Période */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Début période</Label>
                  <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Fin période</Label>
                  <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="mt-1" />
                </div>
              </div>

              {/* NPS (pour mensuels) */}
              {reportType === "monthly" && (
                <div>
                  <Label className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-yellow-400" />
                    Score NPS (0-10)
                  </Label>
                  <Input type="number" min={0} max={10} value={npsScore} onChange={(e) => setNpsScore(e.target.value)} className="mt-1 w-32" placeholder="—" />
                  {npsScore && parseInt(npsScore) >= 0 && parseInt(npsScore) <= 10 && (
                    <p className={cn("text-xs mt-1", parseInt(npsScore) >= 9 ? "text-emerald-400" : parseInt(npsScore) >= 7 ? "text-yellow-400" : "text-red-400")}>
                      {parseInt(npsScore) >= 9 ? "Promoteur — Témoignage vidéo + referral sous 48h" : parseInt(npsScore) >= 7 ? "Passif — Call 15 min pour améliorer" : "Détracteur — Call d'urgence + escalade sous 24h"}
                    </p>
                  )}
                </div>
              )}

              {/* Métriques */}
              <div>
                <Label className="text-muted-foreground">Chiffres</Label>
                <div className="grid grid-cols-4 gap-3 mt-2">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Leads</Label>
                    <Input type="number" value={leads} onChange={(e) => setLeads(e.target.value)} className="mt-0.5" placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Appels bookés</Label>
                    <Input type="number" value={appelsBookes} onChange={(e) => setAppelsBookes(e.target.value)} className="mt-0.5" placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Show-up %</Label>
                    <Input type="number" value={showUpPct} onChange={(e) => setShowUpPct(e.target.value)} className="mt-0.5" placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Closes</Label>
                    <Input type="number" value={closes} onChange={(e) => setCloses(e.target.value)} className="mt-0.5" placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Dépense pub (€)</Label>
                    <Input type="number" value={depensePub} onChange={(e) => setDepensePub(e.target.value)} className="mt-0.5" placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">CPA (€)</Label>
                    <Input type="number" value={cpa} onChange={(e) => setCpa(e.target.value)} className="mt-0.5" placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">CA mensuel (€)</Label>
                    <Input type="number" value={caMensuel} onChange={(e) => setCaMensuel(e.target.value)} className="mt-0.5" placeholder="0" />
                  </div>
                </div>
              </div>

              {/* Diagnostic + Actions */}
              <div>
                <Label>Diagnostic</Label>
                <Textarea value={diagnostic} onChange={(e) => setDiagnostic(e.target.value)} className="mt-1" rows={3} placeholder="Ce qui va bien / À améliorer..." />
              </div>
              <div>
                <Label>Actions cette semaine</Label>
                <Textarea value={actions} onChange={(e) => setActions(e.target.value)} className="mt-1" rows={2} placeholder="3 actions max avec deadlines..." />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" rows={2} placeholder="Notes complémentaires..." />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" className="text-white hover:text-white" onClick={() => setShowAdd(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={saving} className="bg-neon text-black hover:bg-neon/90">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer le rapport
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
