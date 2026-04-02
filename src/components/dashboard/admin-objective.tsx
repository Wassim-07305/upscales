"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/stores/ui-store";
import { cn, formatCurrency } from "@/lib/utils";
import { Target, TrendingUp, Pencil, Check, X } from "lucide-react";

interface AdminObjectiveProps {
  className?: string;
}

export function AdminObjective({ className }: AdminObjectiveProps) {
  const supabase = useSupabase();
  const { user } = useAuth();
  const { monthlyObjective, setMonthlyObjective } = useUIStore();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  // Toujours le CA du mois en cours (via la view dashboard_kpis)
  const { data, isLoading } = useQuery({
    queryKey: ["admin-objective-monthly"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: kpis } = await supabase
        .from("dashboard_kpis")
        .select("revenue_this_month")
        .single();
      return { revenue: Number(kpis?.revenue_this_month ?? 0) };
    },
  });

  const objective = monthlyObjective;
  const current = data?.revenue ?? 0;
  const percent =
    objective > 0 ? Math.min(Math.round((current / objective) * 100), 100) : 0;
  const remaining = Math.max(objective - current, 0);

  const handleStartEdit = () => {
    setEditValue(String(objective));
    setEditing(true);
  };

  const handleSave = () => {
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setMonthlyObjective(parsed);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  return (
    <div
      className={cn("bg-surface rounded-xl p-6", className)}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Objectif mensuel
        </h3>
        <div className="flex items-center gap-2">
          {!isLoading && !editing && (
            <span
              className={cn(
                "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                percent >= 100
                  ? "bg-emerald-500/10 text-emerald-600"
                  : percent >= 75
                    ? "bg-blue-500/10 text-blue-600"
                    : percent >= 50
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-lime-400/10 text-lime-400",
              )}
            >
              {percent}%
            </span>
          )}
          {!editing && (
            <button
              onClick={handleStartEdit}
              className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Modifier l'objectif"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 w-full animate-shimmer rounded-full" />
          <div className="h-3 w-32 animate-shimmer rounded-lg" />
        </div>
      ) : (
        <>
          {/* Editable objective */}
          {editing && (
            <div className="flex items-center gap-2 mb-3">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                className="h-8 w-full rounded-lg border border-border bg-muted/50 px-3 text-sm font-medium tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/30"
                autoFocus
                min={1}
                step={1000}
              />
              <button
                onClick={handleSave}
                className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
              >
                <Check className="size-4" />
              </button>
              <button
                onClick={handleCancel}
                className="size-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Main progress bar */}
          <div className="h-4 bg-muted rounded-full overflow-hidden mb-3">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                percent >= 100
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                  : percent >= 75
                    ? "bg-gradient-to-r from-blue-400 to-blue-600"
                    : percent >= 50
                      ? "bg-gradient-to-r from-amber-400 to-amber-500"
                      : "bg-gradient-to-r from-lime-300 to-lime-400",
              )}
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-display font-bold text-foreground">
                {formatCurrency(current)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                / {formatCurrency(objective)}
              </span>
            </div>
            {remaining > 0 ? (
              <span className="text-[11px] text-muted-foreground">
                Reste {formatCurrency(remaining)}
              </span>
            ) : (
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Objectif atteint
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
