"use client";

import { useState } from "react";
import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";
import {
  Users,
  CalendarCheck,
  AlertTriangle,
  ChevronRight,
  Eye,
  ShieldCheck,
  Pencil,
  Check,
  X,
  MessageSquare,
  PhoneCall,
} from "lucide-react";
import type {
  CoachWithStats,
  EnrichedClient,
} from "@/hooks/use-csm-management";
import { useUpdateCoachSpecialties } from "@/hooks/use-csm-management";
import type { Profile } from "@/types/database";
import { SPECIALTIES } from "@/lib/specialties";

interface CoachCardProps {
  data: CoachWithStats;
  onViewDetails?: (coachId: string) => void;
  onReassignClient?: (clientId: string, clientName: string) => void;
  onUnassignClient?: (clientId: string) => void;
}

function getWorkloadColor(clientCount: number): {
  bar: string;
  text: string;
  label: string;
} {
  if (clientCount > 20)
    return {
      bar: "bg-lime-400",
      text: "text-lime-400",
      label: "Surcharge",
    };
  if (clientCount >= 10)
    return {
      bar: "bg-amber-500",
      text: "text-amber-600",
      label: "Charge elevee",
    };
  return {
    bar: "bg-emerald-500",
    text: "text-emerald-600",
    label: "Optimal",
  };
}

export function CoachCard({
  data,
  onViewDetails,
  onReassignClient,
  onUnassignClient,
}: CoachCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingSpecs, setEditingSpecs] = useState(false);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const updateSpecialties = useUpdateCoachSpecialties();
  const {
    coach,
    clientCount,
    totalRevenue,
    sessionsThisMonth,
    averageHealthScore,
    atRiskClients,
    retentionRate,
    clients,
  } = data;
  const workload = getWorkloadColor(clientCount);
  const coachSpecs =
    (coach as Profile & { specialties?: string[] }).specialties ?? [];

  const handleEditSpecs = () => {
    setSelectedSpecs([...coachSpecs]);
    setEditingSpecs(true);
  };

  const handleSaveSpecs = () => {
    updateSpecialties.mutate(
      { coachId: coach.id, specialties: selectedSpecs },
      { onSuccess: () => setEditingSpecs(false) },
    );
  };

  const toggleSpec = (value: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  };

  return (
    <div
      className="bg-surface rounded-2xl border border-border overflow-hidden transition-all duration-200 hover:shadow-md"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Workload indicator bar */}
      <div className={cn("h-1", workload.bar)} />

      <div className="p-5">
        {/* Coach header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-sm text-primary font-medium shrink-0">
            {coach.avatar_url ? (
              <Image
                src={coach.avatar_url}
                alt={coach.full_name}
                width={48}
                height={48}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(coach.full_name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {coach.full_name}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              {coachSpecs.length > 0 ? (
                coachSpecs.map((s) => (
                  <span
                    key={s}
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
                  >
                    {SPECIALTIES.find((sp) => sp.value === s)?.label ?? s}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  Aucune specialite
                </span>
              )}
              <button
                onClick={handleEditSpecs}
                className="w-4 h-4 rounded flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                title="Modifier les specialites"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
          <span
            className={cn(
              "text-[10px] font-medium px-2 py-0.5 rounded-full",
              clientCount > 20
                ? "bg-lime-100 text-lime-500"
                : clientCount >= 10
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700",
            )}
          >
            {workload.label}
          </span>
        </div>

        {/* Specialties editor */}
        {editingSpecs && (
          <div className="mb-4 p-3 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-foreground">Specialites</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingSpecs(false)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleSaveSpecs}
                  disabled={
                    updateSpecialties.isPending || selectedSpecs.length === 0
                  }
                  className="h-6 px-2 rounded-md bg-primary text-white text-[10px] font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Sauvegarder
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {SPECIALTIES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleSpec(s.value)}
                  className={cn(
                    "h-7 px-2 rounded-md text-[10px] font-medium transition-all border",
                    selectedSpecs.includes(s.value)
                      ? "bg-primary/15 border-primary/30 text-primary"
                      : "bg-surface border-border text-muted-foreground hover:border-primary/20",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {selectedSpecs.length === 0 && (
              <p className="text-[10px] text-amber-500 mt-1.5">
                Min. 1 specialite
              </p>
            )}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30">
            <Users className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-lg font-bold text-foreground font-mono tabular-nums leading-tight">
                {clientCount}
              </p>
              <p className="text-[10px] text-muted-foreground">Clients</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30">
            <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-lg font-bold text-foreground font-mono tabular-nums leading-tight">
                {clients.reduce((s, c) => s + c.dmsTotal, 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">DMs clients</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30">
            <CalendarCheck className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-lg font-bold text-foreground font-mono tabular-nums leading-tight">
                {sessionsThisMonth}
              </p>
              <p className="text-[10px] text-muted-foreground">Sessions/mois</p>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 p-2.5 rounded-xl",
              atRiskClients > 0 ? "bg-lime-400/10" : "bg-muted/30",
            )}
          >
            <AlertTriangle
              className={cn(
                "w-4 h-4 shrink-0",
                atRiskClients > 0 ? "text-lime-400" : "text-muted-foreground",
              )}
            />
            <div>
              <p
                className={cn(
                  "text-lg font-bold font-mono tabular-nums leading-tight",
                  atRiskClients > 0 ? "text-lime-400" : "text-foreground",
                )}
              >
                {atRiskClients}
              </p>
              <p className="text-[10px] text-muted-foreground">À risque</p>
            </div>
          </div>
        </div>

        {/* Performance indicators */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5" />
            Retention:{" "}
            <span className="font-mono font-semibold text-foreground">
              {retentionRate}%
            </span>
          </span>
          {atRiskClients > 0 && (
            <span className="flex items-center gap-1 text-lime-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {atRiskClients} à risque
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(coach.id)}
              className="flex-1 h-8 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Voir details
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 flex items-center gap-1.5",
              isExpanded && "bg-muted text-foreground",
            )}
          >
            <ChevronRight
              className={cn(
                "w-3.5 h-3.5 transition-transform",
                isExpanded && "rotate-90",
              )}
            />
            Clients
          </button>
        </div>
      </div>

      {/* Expanded client list */}
      {isExpanded && clients.length > 0 && (
        <div className="border-t border-border bg-muted/20 px-5 py-3 space-y-2 max-h-64 overflow-y-auto">
          {clients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              onUnassign={onUnassignClient}
            />
          ))}
        </div>
      )}

      {isExpanded && clients.length === 0 && (
        <div className="border-t border-border bg-muted/20 px-5 py-6 text-center">
          <p className="text-xs text-muted-foreground">Aucun client assigne</p>
        </div>
      )}
    </div>
  );
}

// ─── Client Row ─────────────────────────────────────────────

const FLAG_CONFIG: Record<
  string,
  { dot: string; badge: string; label: string }
> = {
  green: {
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    label: "En bonne voie",
  },
  yellow: {
    dot: "bg-yellow-500",
    badge:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
    label: "Attention",
  },
  orange: {
    dot: "bg-orange-500",
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
    label: "À surveiller",
  },
  red: {
    dot: "bg-lime-400",
    badge: "bg-lime-100 text-lime-500 dark:bg-lime-400/15 dark:text-lime-300",
    label: "À risque",
  },
};

function ClientRow({
  client,

  onUnassign,
}: {
  client: EnrichedClient | null;
  onUnassign?: (clientId: string) => void;
}) {
  if (!client) return null;
  const details = client.student_details?.[0];
  const flagKey = details?.flag ?? null;
  const flagCfg = flagKey ? FLAG_CONFIG[flagKey] : null;

  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-[10px] text-primary font-medium shrink-0">
        {getInitials(client.full_name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          {client.full_name}
        </p>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground shrink-0">
        {flagCfg && (
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
              flagCfg.badge,
            )}
          >
            {flagCfg.label}
          </span>
        )}
        <span className="flex items-center gap-1" title="DMs envoyés">
          <MessageSquare className="w-3 h-3" />
          {client.dmsTotal}
        </span>
        <span className="flex items-center gap-1" title="Appels réalisés">
          <PhoneCall className="w-3 h-3" />
          {client.callsTotal}
        </span>
      </div>
      {onUnassign && (
        <button
          onClick={() => onUnassign(client.id)}
          className="shrink-0 text-[10px] text-lime-400 hover:text-lime-400 hover:underline transition-colors"
        >
          Retirer
        </button>
      )}
    </div>
  );
}
