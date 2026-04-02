"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useSupabase } from "@/hooks/use-supabase";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/database";
import {
  UserPlus,
  Users,
  Mail,
  Calendar,
  Trophy,
  Loader2,
  Search,
} from "lucide-react";

interface ProspectWithScore extends Profile {
  quiz_score?: number | null;
  quiz_max?: number | null;
}

export default function ProspectsContent() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [convertTarget, setConvertTarget] = useState<ProspectWithScore | null>(
    null,
  );

  // Fetch prospects
  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ["prospects"],
    queryFn: async () => {
      // Fetch profiles with role = prospect
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "prospect")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch latest quiz submissions for these prospects
      const profileIds = (profiles ?? []).map((p: Profile) => p.id);
      let submissions: Array<{
        profile_id: string;
        score: number;
        max_score: number;
      }> = [];

      if (profileIds.length > 0) {
        const { data: subs } = await supabase
          .from("quiz_submissions")
          .select("profile_id, score, max_score")
          .in("profile_id", profileIds)
          .order("created_at", { ascending: false });
        submissions = subs ?? [];
      }

      // Map latest submission per prospect
      const scoreMap = new Map<string, { score: number; max_score: number }>();
      for (const s of submissions) {
        if (s.profile_id && !scoreMap.has(s.profile_id)) {
          scoreMap.set(s.profile_id, {
            score: s.score,
            max_score: s.max_score,
          });
        }
      }

      return (profiles ?? []).map((p: Profile): ProspectWithScore => {
        const sc = scoreMap.get(p.id);
        return {
          ...p,
          quiz_score: sc?.score ?? null,
          quiz_max: sc?.max_score ?? null,
        };
      });
    },
  });

  // Convert prospect to client
  const convertMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "client" })
        .eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      toast.success("Prospect converti en client avec succes");
      setConvertTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la conversion");
    },
  });

  // Filter
  const filtered = prospects.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (prospects.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-6 h-6" />}
        title="Aucun prospect"
        description="Les utilisateurs qui s'inscrivent sans invitation apparaitront ici."
      />
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Search */}
      <motion.div variants={staggerItem}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un prospect..."
            className="w-full h-9 pl-9 pr-4 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>
      </motion.div>

      {/* Count */}
      <motion.p
        variants={staggerItem}
        className="text-sm text-muted-foreground"
      >
        {filtered.length} prospect{filtered.length > 1 ? "s" : ""}
      </motion.p>

      {/* List */}
      <motion.div variants={staggerItem} className="space-y-2">
        {filtered.map((prospect) => (
          <motion.div
            key={prospect.id}
            variants={staggerItem}
            className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl hover:border-border/80 transition-colors"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-primary">
                {prospect.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) ?? "?"}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {prospect.full_name}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  {prospect.email}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDate(prospect.created_at)}
                </span>
              </div>
            </div>

            {/* Quiz score */}
            {prospect.quiz_score !== null && prospect.quiz_max !== null && (
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                  "bg-amber-500/10 text-amber-500",
                )}
              >
                <Trophy className="w-3.5 h-3.5" />
                {prospect.quiz_score}/{prospect.quiz_max}
              </div>
            )}

            {/* Convert button */}
            <Button
              variant="outline"
              size="sm"
              icon={<UserPlus className="w-3.5 h-3.5" />}
              onClick={() => setConvertTarget(prospect)}
            >
              Convertir
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={!!convertTarget}
        onClose={() => setConvertTarget(null)}
        onConfirm={() => {
          if (convertTarget) convertMutation.mutate(convertTarget.id);
        }}
        title="Convertir en client"
        description={`Voulez-vous convertir ${convertTarget?.full_name ?? "ce prospect"} en client ? Il aura acces a l'espace client.`}
        confirmLabel="Convertir en client"
        variant="primary"
        loading={convertMutation.isPending}
      />
    </motion.div>
  );
}
