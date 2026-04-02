"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn, getInitials } from "@/lib/utils";
import {
  useCoachesWithStats,
  useReassignClient,
  useUnassignClient,
  useBulkAssign,
} from "@/hooks/use-csm-management";
import { useCoaches, useAutoAssignCoach } from "@/hooks/use-coach-assignments";
import { CsmStatsOverview } from "@/components/admin/csm-stats-overview";
import { CoachCard } from "@/components/admin/coach-card";
import {
  Users,
  UserX,
  Zap,
  Loader2,
  Search,
  CheckSquare,
  Square,
  ArrowRight,
  X,
} from "lucide-react";
import type { Profile } from "@/types/database";

export default function AdminCsmPage() {
  const { data, isLoading } = useCoachesWithStats();
  const autoAssign = useAutoAssignCoach();
  const reassignClient = useReassignClient();
  const unassignClient = useUnassignClient();
  const bulkAssign = useBulkAssign();

  const [search, setSearch] = useState("");
  const [selectedUnassigned, setSelectedUnassigned] = useState<Set<string>>(
    new Set(),
  );
  const [bulkCoachId, setBulkCoachId] = useState<string | null>(null);
  const [reassignModal, setReassignModal] = useState<{
    clientId: string;
    clientName: string;
  } | null>(null);

  const coaches = data?.coaches ?? [];
  const unassignedClients = data?.unassignedClients ?? [];
  const overview = data?.overview ?? {
    totalCoaches: 0,
    totalAssigned: 0,
    totalUnassigned: 0,
    sessionsThisWeek: 0,
    averageSatisfaction: 0,
  };

  // Filtered coaches by search
  const filteredCoaches = useMemo(() => {
    if (!search.trim()) return coaches;
    const q = search.toLowerCase();
    return coaches.filter(
      (c) =>
        (c.coach?.full_name ?? "").toLowerCase().includes(q) ||
        (c.coach?.email ?? "").toLowerCase().includes(q),
    );
  }, [coaches, search]);

  // Bulk assign handlers
  const toggleUnassigned = (id: string) => {
    setSelectedUnassigned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllUnassigned = () => {
    if (selectedUnassigned.size === unassignedClients.length) {
      setSelectedUnassigned(new Set());
    } else {
      setSelectedUnassigned(new Set(unassignedClients.map((c) => c.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkCoachId || selectedUnassigned.size === 0) return;
    await bulkAssign.mutateAsync({
      clientIds: Array.from(selectedUnassigned),
      coachId: bulkCoachId,
    });
    setSelectedUnassigned(new Set());
    setBulkCoachId(null);
  };

  const handleAutoAssignAll = async () => {
    const results = await Promise.all(
      unassignedClients.map((client) =>
        autoAssign
          .mutateAsync({ clientId: client.id })
          .then(() => ({ success: true }))
          .catch(() => ({ success: false })),
      ),
    );
    const successes = results.filter((r) => r.success).length;
    const failures = results.length - successes;
    if (failures > 0) {
      toast.error(
        `${failures} assignation${failures > 1 ? "s" : ""} en echec sur ${results.length}`,
      );
    }
    if (successes > 0) {
      toast.success(
        `${successes} client${successes > 1 ? "s" : ""} assigne${successes > 1 ? "s" : ""} avec succès`,
      );
    }
  };

  return (
    <motion.div variants={staggerContainer} className="space-y-6">
      {/* Stats Overview */}
      <motion.div variants={staggerItem}>
        <CsmStatsOverview stats={overview} isLoading={isLoading} />
      </motion.div>

      {/* Unassigned clients banner */}
      {!isLoading && unassignedClients.length > 0 && (
        <motion.div
          variants={staggerItem}
          className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-900 dark:text-amber-400">
                {unassignedClients.length} client
                {unassignedClients.length > 1 ? "s" : ""} non assigne
                {unassignedClients.length > 1 ? "s" : ""}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllUnassigned}
                className="h-7 px-2.5 rounded-lg border border-amber-300 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors flex items-center gap-1"
              >
                {selectedUnassigned.size === unassignedClients.length ? (
                  <CheckSquare className="w-3.5 h-3.5" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                Tout sélectionner
              </button>
              <button
                onClick={handleAutoAssignAll}
                disabled={autoAssign.isPending}
                className="h-7 px-2.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {autoAssign.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                Auto-assigner tout
              </button>
            </div>
          </div>

          {/* Bulk assign bar */}
          {selectedUnassigned.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-surface dark:bg-surface border border-amber-200 dark:border-border">
              <span className="text-xs font-medium text-foreground">
                {selectedUnassigned.size} selectionne
                {selectedUnassigned.size > 1 ? "s" : ""}
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <select
                value={bulkCoachId ?? ""}
                onChange={(e) => setBulkCoachId(e.target.value || null)}
                className="h-8 px-3 rounded-lg border border-border bg-surface text-sm text-foreground flex-1 max-w-xs"
              >
                <option value="">Choisir un coach...</option>
                {coaches.map((c) => (
                  <option key={c.coach.id} value={c.coach.id}>
                    {c.coach.full_name} ({c.clientCount} clients)
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkAssign}
                disabled={!bulkCoachId || bulkAssign.isPending}
                className="h-8 px-4 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {bulkAssign.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                Assigner
              </button>
            </div>
          )}

          {/* Client chips */}
          <div className="flex flex-wrap gap-2">
            {unassignedClients.slice(0, 20).map((client) => (
              <button
                key={client.id}
                onClick={() => toggleUnassigned(client.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all duration-200",
                  selectedUnassigned.has(client.id)
                    ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20"
                    : "bg-surface dark:bg-surface border-amber-200 dark:border-border hover:border-primary/40",
                )}
              >
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[9px] text-amber-700 font-medium">
                  {getInitials(client.full_name)}
                </div>
                <span className="text-xs text-foreground font-medium">
                  {client.full_name}
                </span>
                {selectedUnassigned.has(client.id) && (
                  <CheckSquare className="w-3 h-3 text-primary" />
                )}
              </button>
            ))}
            {unassignedClients.length > 20 && (
              <span className="text-xs text-amber-600 self-center">
                +{unassignedClients.length - 20} autres
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Search */}
      <motion.div variants={staggerItem}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un coach..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Coach cards grid */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface rounded-2xl border border-border p-5 animate-pulse"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-muted rounded mb-2" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-16 bg-muted/50 rounded-xl" />
                  ))}
                </div>
              </div>
            ))
          : filteredCoaches.map((coachData) => (
              <CoachCard
                key={coachData.coach.id}
                data={coachData}
                onReassignClient={(clientId, clientName) =>
                  setReassignModal({ clientId, clientName })
                }
                onUnassignClient={(clientId) => unassignClient.mutate(clientId)}
              />
            ))}
      </motion.div>

      {!isLoading && filteredCoaches.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search
              ? "Aucun coach ne correspond a votre recherche"
              : "Aucun coach trouve"}
          </p>
        </div>
      )}

      {/* Reassign modal */}
      {reassignModal && (
        <ReassignModal
          clientId={reassignModal.clientId}
          clientName={reassignModal.clientName}
          coaches={coaches}
          isPending={reassignClient.isPending}
          onReassign={async (coachId) => {
            await reassignClient.mutateAsync({
              clientId: reassignModal.clientId,
              newCoachId: coachId,
            });
            setReassignModal(null);
          }}
          onClose={() => setReassignModal(null)}
        />
      )}
    </motion.div>
  );
}

// ─── Reassign Modal ─────────────────────────────────────────

function ReassignModal({
  clientId,
  clientName,
  coaches,
  isPending,
  onReassign,
  onClose,
}: {
  clientId: string;
  clientName: string;
  coaches: { coach: Profile; clientCount: number }[];
  isPending: boolean;
  onReassign: (coachId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-foreground">
              Reassigner le client
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {coaches.map((c) => (
            <button
              key={c.coach.id}
              onClick={() => setSelected(c.coach.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left",
                selected === c.coach.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/30 hover:bg-muted/30",
              )}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-xs text-primary font-medium shrink-0">
                {c.coach.avatar_url ? (
                  <Image
                    src={c.coach.avatar_url}
                    alt=""
                    width={36}
                    height={36}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(c.coach.full_name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {c.coach.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.clientCount} client{c.clientCount !== 1 ? "s" : ""}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={() => selected && onReassign(selected)}
            disabled={!selected || isPending}
            className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Reassigner
          </button>
        </div>
      </div>
    </div>
  );
}
