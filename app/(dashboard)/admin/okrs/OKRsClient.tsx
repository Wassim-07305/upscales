"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logSupabaseError } from "@/lib/error-logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OKRPeriod, OKRObjective, OKRKeyResult, OKRPeriodType } from "@/lib/types/database";

// ─── Schemas ─────────────────────────────────────────────────

const periodSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  type: z.enum(["annual", "quarterly", "monthly"]),
  start_date: z.string().min(1, "Date de début requise"),
  end_date: z.string().min(1, "Date de fin requise"),
});
type PeriodForm = z.infer<typeof periodSchema>;

const objectiveSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
});
type ObjectiveForm = z.infer<typeof objectiveSchema>;

const keyResultSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  target_value: z.coerce.number().min(1, "Cible requise"),
  current_value: z.coerce.number().min(0),
  unit: z.string().min(1, "Unité requise"),
});
type KeyResultForm = { title: string; target_value: number; current_value: number; unit: string };

// ─── Helpers ─────────────────────────────────────────────────

const PERIOD_LABELS: Record<OKRPeriodType, string> = {
  annual: "Annuel",
  quarterly: "Trimestriel",
  monthly: "Mensuel",
};

const PERIOD_COLORS: Record<OKRPeriodType, string> = {
  annual: "bg-neon/20 text-neon",
  quarterly: "bg-turquoise/20 text-turquoise",
  monthly: "bg-[#FFB800]/20 text-[#FFB800]",
};

function getProgress(kr: OKRKeyResult): number {
  if (kr.target_value === 0) return 0;
  return Math.min(100, Math.round((kr.current_value / kr.target_value) * 100));
}

function getObjectiveProgress(obj: OKRObjective): number {
  if (!obj.key_results || obj.key_results.length === 0) return 0;
  const total = obj.key_results.reduce((sum, kr) => sum + getProgress(kr), 0);
  return Math.round(total / obj.key_results.length);
}

function getStatusInfo(progress: number) {
  if (progress >= 100) return { label: "Atteint", icon: CheckCircle2, color: "text-green-400" };
  if (progress >= 60) return { label: "En cours", icon: TrendingUp, color: "text-neon" };
  if (progress >= 30) return { label: "En retard", icon: Clock, color: "text-[#FFB800]" };
  return { label: "Critique", icon: AlertTriangle, color: "text-red-400" };
}

// ─── Props ───────────────────────────────────────────────────

interface OKRsClientProps {
  periods: OKRPeriod[];
  isAdmin: boolean;
}

// ─── Component ───────────────────────────────────────────────

export function OKRsClient({ periods, isAdmin }: OKRsClientProps) {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(
    new Set(periods.slice(0, 2).map((p) => p.id))
  );
  const [loading, setLoading] = useState(false);

  // Modal states
  const [periodModal, setPeriodModal] = useState<{ open: boolean; period?: OKRPeriod }>({ open: false });
  const [objectiveModal, setObjectiveModal] = useState<{ open: boolean; periodId?: string; objective?: OKRObjective }>({ open: false });
  const [krModal, setKrModal] = useState<{ open: boolean; objectiveId?: string; kr?: OKRKeyResult }>({ open: false });

  const togglePeriod = (id: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Period CRUD ─────────────────────────────────────────

  const handleDeletePeriod = async (id: string) => {
    if (!confirm("Supprimer cette période et tous ses objectifs ?")) return;
    setLoading(true);
    const { error } = await supabase.from("okr_periods").delete().eq("id", id);
    if (error) { logSupabaseError("okr.deletePeriod", error); toast.error(error.message || "Erreur lors de la suppression"); }
    else {
      toast.success("Période supprimée");
      router.refresh();
    }
    setLoading(false);
  };

  // ─── Objective CRUD ──────────────────────────────────────

  const handleDeleteObjective = async (id: string) => {
    if (!confirm("Supprimer cet objectif et ses key results ?")) return;
    setLoading(true);
    const { error } = await supabase.from("okr_objectives").delete().eq("id", id);
    if (error) { logSupabaseError("okr.deleteObjective", error); toast.error(error.message || "Erreur lors de la suppression"); }
    else {
      toast.success("Objectif supprimé");
      router.refresh();
    }
    setLoading(false);
  };

  // ─── KR CRUD ─────────────────────────────────────────────

  const handleDeleteKR = async (id: string) => {
    if (!confirm("Supprimer ce key result ?")) return;
    setLoading(true);
    const { error } = await supabase.from("okr_key_results").delete().eq("id", id);
    if (error) { logSupabaseError("okr.deleteKR", error); toast.error(error.message || "Erreur lors de la suppression"); }
    else {
      toast.success("Key result supprimé");
      router.refresh();
    }
    setLoading(false);
  };

  // ─── Quick update KR value ──────────────────────────────

  const handleUpdateKRValue = async (krId: string, newValue: number) => {
    const { error } = await supabase
      .from("okr_key_results")
      .update({ current_value: newValue })
      .eq("id", krId);
    if (error) { logSupabaseError("okr.updateKRValue", error); toast.error(error.message || "Erreur de mise à jour"); }
    else router.refresh();
  };

  // ─── Global progress ────────────────────────────────────

  const allObjectives = periods.flatMap((p) => p.objectives || []);
  const globalProgress = allObjectives.length > 0
    ? Math.round(allObjectives.reduce((sum, o) => sum + getObjectiveProgress(o), 0) / allObjectives.length)
    : 0;

  // ─── Empty state ────────────────────────────────────────

  if (periods.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">OKRs</h1>
            <p className="text-muted-foreground">Objectifs & Key Results</p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Aucun OKR défini</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre première période pour commencer à suivre vos objectifs.
            </p>
            {isAdmin && (
              <Button onClick={() => setPeriodModal({ open: true })} className="bg-neon text-black hover:bg-neon/90">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle période
              </Button>
            )}
          </CardContent>
        </Card>

        <PeriodFormModal
          open={periodModal.open}
          onClose={() => setPeriodModal({ open: false })}
          supabase={supabase}
          onSuccess={() => { setPeriodModal({ open: false }); router.refresh(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">OKRs</h1>
          <p className="text-muted-foreground">Objectifs & Key Results</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setPeriodModal({ open: true })} className="bg-neon text-black hover:bg-neon/90">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle période
          </Button>
        )}
      </div>

      {/* Global progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression globale</span>
            <span className="text-sm font-bold text-neon">{globalProgress}%</span>
          </div>
          <Progress value={globalProgress} className="h-3" />
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span>{periods.length} période{periods.length > 1 ? "s" : ""}</span>
            <span>{allObjectives.length} objectif{allObjectives.length > 1 ? "s" : ""}</span>
            <span>{allObjectives.flatMap((o) => o.key_results || []).length} key results</span>
          </div>
        </CardContent>
      </Card>

      {/* Periods */}
      {periods.map((period) => {
        const isExpanded = expandedPeriods.has(period.id);
        const periodObjectives = period.objectives || [];
        const periodProgress = periodObjectives.length > 0
          ? Math.round(periodObjectives.reduce((s, o) => s + getObjectiveProgress(o), 0) / periodObjectives.length)
          : 0;

        return (
          <Card key={period.id}>
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => togglePeriod(period.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <CardTitle className="text-lg">{period.title}</CardTitle>
                  <Badge variant="outline" className={cn("text-xs", PERIOD_COLORS[period.type as OKRPeriodType])}>
                    {PERIOD_LABELS[period.type as OKRPeriodType]}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {new Date(period.start_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                      {" → "}
                      {new Date(period.end_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <Badge variant="outline" className="font-mono">{periodProgress}%</Badge>
                  {isAdmin && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPeriodModal({ open: true, period })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-300"
                        onClick={() => handleDeletePeriod(period.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-6 pt-0">
                {periodObjectives.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun objectif pour cette période.
                  </p>
                )}

                {periodObjectives.map((obj) => {
                  const objProgress = getObjectiveProgress(obj);
                  const status = getStatusInfo(objProgress);
                  const StatusIcon = status.icon;

                  return (
                    <div key={obj.id} className="border border-border/50 rounded-lg p-4 space-y-3">
                      {/* Objective header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-neon shrink-0" />
                            <h3 className="font-semibold">{obj.title}</h3>
                            <StatusIcon className={cn("h-4 w-4 shrink-0", status.color)} />
                            <span className={cn("text-xs", status.color)}>{status.label}</span>
                          </div>
                          {obj.description && (
                            <p className="text-sm text-muted-foreground mt-1 ml-6">{obj.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">{objProgress}%</Badge>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setObjectiveModal({ open: true, periodId: period.id, objective: obj })}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-400 hover:text-red-300"
                                onClick={() => handleDeleteObjective(obj.id)}
                                disabled={loading}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Key Results */}
                      <div className="ml-6 space-y-2">
                        {(obj.key_results || []).map((kr) => {
                          const krProgress = getProgress(kr);
                          return (
                            <div key={kr.id} className="flex items-center gap-3 group">
                              <span className="text-sm text-muted-foreground min-w-0 flex-shrink truncate max-w-[280px]">
                                {kr.title}
                              </span>
                              <Progress value={krProgress} className="h-2 flex-1" />
                              <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                                {kr.current_value}/{kr.target_value} {kr.unit}
                              </span>
                              <span className={cn(
                                "text-xs font-bold whitespace-nowrap",
                                krProgress >= 100 ? "text-green-400" : krProgress >= 60 ? "text-neon" : "text-muted-foreground"
                              )}>
                                {krProgress}%
                              </span>
                              {isAdmin && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setKrModal({ open: true, objectiveId: obj.id, kr })}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-400 hover:text-red-300"
                                    onClick={() => handleDeleteKR(kr.id)}
                                    disabled={loading}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add KR button */}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-6 text-xs text-muted-foreground"
                          onClick={() => setKrModal({ open: true, objectiveId: obj.id })}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter un key result
                        </Button>
                      )}
                    </div>
                  );
                })}

                {/* Add objective button */}
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() => setObjectiveModal({ open: true, periodId: period.id })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un objectif
                  </Button>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Modals */}
      <PeriodFormModal
        open={periodModal.open}
        period={periodModal.period}
        onClose={() => setPeriodModal({ open: false })}
        supabase={supabase}
        onSuccess={() => { setPeriodModal({ open: false }); router.refresh(); }}
      />

      <ObjectiveFormModal
        open={objectiveModal.open}
        periodId={objectiveModal.periodId}
        objective={objectiveModal.objective}
        onClose={() => setObjectiveModal({ open: false })}
        supabase={supabase}
        onSuccess={() => { setObjectiveModal({ open: false }); router.refresh(); }}
      />

      <KRFormModal
        open={krModal.open}
        objectiveId={krModal.objectiveId}
        kr={krModal.kr}
        onClose={() => setKrModal({ open: false })}
        supabase={supabase}
        onSuccess={() => { setKrModal({ open: false }); router.refresh(); }}
      />
    </div>
  );
}

// ─── Period Modal ────────────────────────────────────────────

function PeriodFormModal({
  open,
  period,
  onClose,
  supabase,
  onSuccess,
}: {
  open: boolean;
  period?: OKRPeriod;
  onClose: () => void;
  supabase: ReturnType<typeof createBrowserClient>;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const form = useForm<PeriodForm>({
    resolver: zodResolver(periodSchema),
    values: period
      ? { title: period.title, type: period.type, start_date: period.start_date, end_date: period.end_date }
      : { title: "", type: "quarterly", start_date: "", end_date: "" },
  });

  const onSubmit = async (data: PeriodForm) => {
    setLoading(true);
    if (period) {
      const { error } = await supabase.from("okr_periods").update(data).eq("id", period.id);
      if (error) { logSupabaseError("okr.updatePeriod", error); toast.error(error.message || "Erreur de mise à jour"); setLoading(false); return; }
      toast.success("Période mise à jour");
    } else {
      const { error } = await supabase.from("okr_periods").insert(data);
      if (error) { logSupabaseError("okr.createPeriod", error); toast.error(error.message || "Erreur de création"); setLoading(false); return; }
      toast.success("Période créée");
    }
    setLoading(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{period ? "Modifier la période" : "Nouvelle période"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input {...form.register("title")} placeholder="Ex: Q1 2026" />
            {form.formState.errors.title && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as OKRPeriodType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annuel</SelectItem>
                <SelectItem value="quarterly">Trimestriel</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date de début</Label>
              <Input type="date" {...form.register("start_date")} />
            </div>
            <div>
              <Label>Date de fin</Label>
              <Input type="date" {...form.register("end_date")} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading} className="bg-neon text-black hover:bg-neon/90">
              {loading ? "..." : period ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Objective Modal ─────────────────────────────────────────

function ObjectiveFormModal({
  open,
  periodId,
  objective,
  onClose,
  supabase,
  onSuccess,
}: {
  open: boolean;
  periodId?: string;
  objective?: OKRObjective;
  onClose: () => void;
  supabase: ReturnType<typeof createBrowserClient>;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const form = useForm<ObjectiveForm>({
    resolver: zodResolver(objectiveSchema),
    values: objective
      ? { title: objective.title, description: objective.description || "" }
      : { title: "", description: "" },
  });

  const onSubmit = async (data: ObjectiveForm) => {
    setLoading(true);
    if (objective) {
      const { error } = await supabase.from("okr_objectives").update(data).eq("id", objective.id);
      if (error) { logSupabaseError("okr.updateObjective", error); toast.error(error.message || "Erreur de mise à jour"); setLoading(false); return; }
      toast.success("Objectif mis à jour");
    } else {
      const { error } = await supabase.from("okr_objectives").insert({ ...data, period_id: periodId });
      if (error) { logSupabaseError("okr.createObjective", error); toast.error(error.message || "Erreur de création"); setLoading(false); return; }
      toast.success("Objectif créé");
    }
    setLoading(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{objective ? "Modifier l'objectif" : "Nouvel objectif"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input {...form.register("title")} placeholder="Ex: Acquisition client prédictible et rentable" />
            {form.formState.errors.title && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div>
            <Label>Description (optionnel)</Label>
            <Textarea {...form.register("description")} placeholder="Détails de l'objectif..." rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading} className="bg-neon text-black hover:bg-neon/90">
              {loading ? "..." : objective ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Key Result Modal ────────────────────────────────────────

function KRFormModal({
  open,
  objectiveId,
  kr,
  onClose,
  supabase,
  onSuccess,
}: {
  open: boolean;
  objectiveId?: string;
  kr?: OKRKeyResult;
  onClose: () => void;
  supabase: ReturnType<typeof createBrowserClient>;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const form = useForm<KeyResultForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(keyResultSchema) as any,
    values: kr
      ? { title: kr.title, target_value: kr.target_value, current_value: kr.current_value, unit: kr.unit }
      : { title: "", target_value: 100, current_value: 0, unit: "%" },
  });

  const onSubmit = async (data: KeyResultForm) => {
    setLoading(true);
    if (kr) {
      const { error } = await supabase.from("okr_key_results").update(data).eq("id", kr.id);
      if (error) { logSupabaseError("okr.updateKR", error); toast.error(error.message || "Erreur de mise à jour"); setLoading(false); return; }
      toast.success("Key result mis à jour");
    } else {
      const { error } = await supabase.from("okr_key_results").insert({ ...data, objective_id: objectiveId });
      if (error) { logSupabaseError("okr.createKR", error); toast.error(error.message || "Erreur de création"); setLoading(false); return; }
      toast.success("Key result créé");
    }
    setLoading(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kr ? "Modifier le key result" : "Nouveau key result"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input {...form.register("title")} placeholder="Ex: 120 calls qualifiés/mois via tunnel VSL" />
            {form.formState.errors.title && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Valeur actuelle</Label>
              <Input type="number" step="any" {...form.register("current_value")} />
            </div>
            <div>
              <Label>Cible</Label>
              <Input type="number" step="any" {...form.register("target_value")} />
            </div>
            <div>
              <Label>Unité</Label>
              <Input {...form.register("unit")} placeholder="%, €, calls..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading} className="bg-neon text-black hover:bg-neon/90">
              {loading ? "..." : kr ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
