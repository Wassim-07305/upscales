"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HeartPulse,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  ExternalLink,
  Instagram,
  BarChart3,
  Star,
  Loader2,
  Save,
  Plus,
  FileText,
} from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { logSupabaseError } from "@/lib/error-logger";
import type { CoachClient, CoachPhase, HealthStatus } from "@/lib/types/database";

const PHASES: Record<CoachPhase, { label: string; color: string; description: string }> = {
  onboarding: { label: "Onboarding", color: "bg-blue-400/20 text-blue-400", description: "J0-J7 — Calls + premier CSM" },
  lancement: { label: "Lancement", color: "bg-cyan-400/20 text-cyan-400", description: "J7-J30 — Ads en cours, premiers leads" },
  optimisation: { label: "Optimisation", color: "bg-neon/20 text-neon", description: "J31-J60 — Objectif 5-20 clients/mois" },
  scaling: { label: "Scaling", color: "bg-purple-400/20 text-purple-400", description: "J61-J90 — Promesse atteinte" },
  autonomie: { label: "Autonomie", color: "bg-emerald-400/20 text-emerald-400", description: "J91+ — Check-ins bi-mensuels" },
  offboarding: { label: "Offboarding", color: "bg-orange-400/20 text-orange-400", description: "Fin de contrat" },
};

const HEALTH: Record<HealthStatus, { label: string; icon: string; color: string }> = {
  en_forme: { label: "En forme", icon: "🟢", color: "text-emerald-400" },
  attention: { label: "Attention", icon: "🟡", color: "text-yellow-400" },
  critique: { label: "Critique", icon: "🔴", color: "text-red-400" },
  a_risque: { label: "À risque", icon: "⚠️", color: "text-orange-400" },
};

const PLAN_TEMPLATE = `<h2>1. Offre + Client Idéal</h2><p></p><h2>2. Publicité (Trafic)</h2><p></p><h2>3. VSL (Vidéo de Conversion)</h2><p></p><h2>4. Vidéo de Remerciement</h2><p></p><h2>5. VSP (Post-Réservation)</h2><p></p><h2>6. Prochaines Étapes</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Filmer les publicités</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Lancer les publicités</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Filmer la VSL</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Envoyer les stats dans 3-5 jours</p></div></li></ul>`;

interface CoachSectionProps {
  clientId: string;
  coachClient: CoachClient | null;
}

export function CoachSection({ clientId, coachClient: initial }: CoachSectionProps) {
  const supabase = createClient();
  const [data, setData] = useState<CoachClient | null>(initial);
  const [saving, setSaving] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [creating, setCreating] = useState(false);

  // Editable fields — Suivi
  const [phase, setPhase] = useState<CoachPhase>(initial?.phase || "onboarding");
  const [health, setHealth] = useState<HealthStatus>(initial?.health_status || "en_forme");
  const [revenue, setRevenue] = useState(String(initial?.monthly_revenue || 0));
  const [nps, setNps] = useState(initial?.nps_score != null ? String(initial.nps_score) : "");
  const [product, setProduct] = useState(initial?.product || "");
  const [instagram, setInstagram] = useState(initial?.instagram_url || "");
  const [adsUrl, setAdsUrl] = useState(initial?.ads_url || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [startDate, setStartDate] = useState(initial?.start_date || new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(initial?.end_date || "");

  // Plan client
  const [planContent, setPlanContent] = useState(initial?.plan_content || "");

  // Calculated alerts
  const daysSinceContact = data?.last_contact_at
    ? Math.floor((Date.now() - new Date(data.last_contact_at).getTime()) / 86400000)
    : null;

  const daysRemaining = data?.end_date
    ? Math.floor((new Date(data.end_date).getTime() - Date.now()) / 86400000)
    : null;

  const daysSinceStart = data?.start_date
    ? Math.floor((Date.now() - new Date(data.start_date).getTime()) / 86400000)
    : null;

  const silenceAlert = daysSinceContact !== null && daysSinceContact > 5;

  const handleCreate = async () => {
    setCreating(true);
    const { data: created, error } = await supabase
      .from("coach_clients")
      .insert({
        client_id: clientId,
        phase: "onboarding",
        health_status: "en_forme",
        start_date: new Date().toISOString().split("T")[0],
        plan_content: PLAN_TEMPLATE,
      })
      .select()
      .single();

    if (error) {
      logSupabaseError("create coach_client", error);
      toast.error("Erreur de création");
    } else {
      setData(created);
      setPlanContent(created.plan_content || "");
      toast.success("Suivi coach activé");
    }
    setCreating(false);
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);

    const payload = {
      phase,
      health_status: health,
      monthly_revenue: parseFloat(revenue) || 0,
      nps_score: nps ? parseInt(nps) : null,
      product: product || null,
      instagram_url: instagram || null,
      ads_url: adsUrl || null,
      notes: notes || null,
      start_date: startDate,
      end_date: endDate || null,
      last_contact_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("coach_clients")
      .update(payload)
      .eq("id", data.id);

    if (error) {
      logSupabaseError("update coach_client", error);
      toast.error("Erreur de sauvegarde");
    } else {
      setData({ ...data, ...payload });
      toast.success("Suivi mis à jour");
    }
    setSaving(false);
  };

  const handleSavePlan = async () => {
    if (!data) return;
    setSavingPlan(true);

    const { error } = await supabase
      .from("coach_clients")
      .update({ plan_content: planContent || null })
      .eq("id", data.id);

    if (error) {
      logSupabaseError("update plan", error);
      toast.error("Erreur de sauvegarde du plan");
    } else {
      setData({ ...data, plan_content: planContent || null });
      toast.success("Plan enregistré");
    }
    setSavingPlan(false);
  };

  const markContact = async () => {
    if (!data) return;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("coach_clients")
      .update({ last_contact_at: now })
      .eq("id", data.id);

    if (error) {
      logSupabaseError("mark contact", error);
      toast.error("Erreur");
    } else {
      setData({ ...data, last_contact_at: now });
      toast.success("Contact enregistré");
    }
  };

  // No coach data yet — show activate button
  if (!data) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <HeartPulse className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-semibold mb-1">Suivi Coach non activé</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Activez le suivi pour tracker les phases, la santé client et le CA.
          </p>
          <Button onClick={handleCreate} disabled={creating} size="sm" className="bg-neon text-black hover:bg-neon/90">
            {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Activer le suivi coach
          </Button>
        </CardContent>
      </Card>
    );
  }

  const phaseConfig = PHASES[phase];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-neon" />
          <CardTitle className="text-base">Suivi Coach</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="suivi">
          <TabsList className="mb-4">
            <TabsTrigger value="suivi">Suivi</TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Plan client
            </TabsTrigger>
          </TabsList>

          {/* ─── Onglet Suivi ──────────────────────────────── */}
          <TabsContent value="suivi" className="space-y-5 mt-0">
            {/* Save button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="sm" className="bg-neon text-black hover:bg-neon/90">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Enregistrer
              </Button>
            </div>

            {/* Alerts */}
            {(silenceAlert || (daysRemaining !== null && daysRemaining <= 7)) && (
              <div className="space-y-2">
                {silenceAlert && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    <span className="text-sm text-red-400">
                      Alerte silence — {daysSinceContact} jours sans contact
                    </span>
                    <Button onClick={markContact} size="sm" variant="outline" className="ml-auto h-7 text-xs">
                      Marquer contact
                    </Button>
                  </div>
                )}
                {daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <Clock className="h-4 w-4 text-orange-400 shrink-0" />
                    <span className="text-sm text-orange-400">
                      {daysRemaining === 0 ? "Contrat expire aujourd'hui" : `${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} restant${daysRemaining > 1 ? "s" : ""}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Phase + Santé */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Phase</Label>
                <Select value={phase} onValueChange={(v) => setPhase(v as CoachPhase)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PHASES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">{phaseConfig.description}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Santé client</Label>
                <Select value={health} onValueChange={(v) => setHealth(v as HealthStatus)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(HEALTH).map(([key, { label, icon }]) => (
                      <SelectItem key={key} value={key}>{icon} {label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-white/5 border border-border/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-neon" />
                  <span className="text-[11px] text-muted-foreground">CA mensuel</span>
                </div>
                <Input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} className="h-8 text-sm" placeholder="0" />
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-border/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Star className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="text-[11px] text-muted-foreground">NPS (0-10)</span>
                </div>
                <Input type="number" min={0} max={10} value={nps} onChange={(e) => setNps(e.target.value)} className="h-8 text-sm" placeholder="—" />
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-border/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-turquoise" />
                  <span className="text-[11px] text-muted-foreground">Jour {daysSinceStart ?? 0}</span>
                </div>
                <p className="text-sm font-medium mt-1">
                  {daysSinceContact !== null ? (
                    <span className={cn(silenceAlert && "text-red-400")}>
                      Contact il y a {daysSinceContact}j
                    </span>
                  ) : "—"}
                </p>
              </div>
            </div>

            {/* Dates + Produit */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Date début</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date fin</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Produit</Label>
                <Input value={product} onChange={(e) => setProduct(e.target.value)} className="mt-1" placeholder="ex: Upscale 6 mois" />
              </div>
            </div>

            {/* Liens */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Instagram className="h-3 w-3" /> Instagram
                </Label>
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="mt-1" placeholder="https://instagram.com/..." />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> Lien Ads
                </Label>
                <Input value={adsUrl} onChange={(e) => setAdsUrl(e.target.value)} className="mt-1" placeholder="https://..." />
              </div>
            </div>

            {/* Quick links */}
            {(data.instagram_url || data.ads_url) && (
              <div className="flex gap-2">
                {data.instagram_url && (
                  <a href={data.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-neon hover:underline">
                    <ExternalLink className="h-3 w-3" /> Instagram
                  </a>
                )}
                {data.ads_url && (
                  <a href={data.ads_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-neon hover:underline">
                    <ExternalLink className="h-3 w-3" /> Ads Manager
                  </a>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <Label className="text-xs text-muted-foreground">Notes rapides</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" rows={3} placeholder="Notes sur le client..." />
            </div>
          </TabsContent>

          {/* ─── Onglet Plan Client ────────────────────────── */}
          <TabsContent value="plan" className="space-y-4 mt-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Plan individuel du client — offre, publicité, VSL, prochaines étapes.
              </p>
              <div className="flex gap-2">
                {!planContent && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPlanContent(PLAN_TEMPLATE)}
                    className="text-xs text-white hover:text-white"
                  >
                    Charger le template
                  </Button>
                )}
                <Button onClick={handleSavePlan} disabled={savingPlan} size="sm" className="bg-neon text-black hover:bg-neon/90">
                  {savingPlan ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Enregistrer le plan
                </Button>
              </div>
            </div>
            <RichTextEditor
              key={planContent ? "loaded" : "empty"}
              content={planContent}
              onChange={setPlanContent}
              placeholder="Rédigez le plan client ici..."
              minHeight="300px"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
