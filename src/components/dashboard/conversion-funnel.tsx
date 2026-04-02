"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import { useAuth } from "@/hooks/use-auth";
import { Funnel } from "lucide-react";
import { cn } from "@/lib/utils";

const COLUMN_COLORS: Record<string, string> = {
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  green: "bg-emerald-500",
  red: "bg-lime-400",
  violet: "bg-violet-500",
  indigo: "bg-indigo-500",
};

function useFunnelData() {
  const supabase = useSupabase();
  const { user, isStaff } = useAuth();

  return useQuery({
    queryKey: ["conversion-funnel", user?.id],
    enabled: !!user && isStaff,
    staleTime: 30_000,
    queryFn: async () => {
      // Lire les colonnes et leads admin uniquement (client_id IS NULL)
      const [columnsRes, leadsRes] = await Promise.all([
        supabase
          .from("pipeline_columns")
          .select("id, name, color, position")
          .is("client_id", null)
          .order("position", { ascending: true }),
        supabase.from("setter_leads").select("column_id").is("client_id", null),
      ]);

      if (columnsRes.error) throw columnsRes.error;
      if (leadsRes.error) throw leadsRes.error;

      const columns = columnsRes.data as {
        id: string;
        name: string;
        color: string;
        position: number;
      }[];
      const leads = leadsRes.data as { column_id: string | null }[];

      // Compter les leads par colonne
      const countByColumn = new Map<string, number>();
      for (const lead of leads) {
        if (!lead.column_id) continue;
        countByColumn.set(
          lead.column_id,
          (countByColumn.get(lead.column_id) ?? 0) + 1,
        );
      }

      return columns.map((col) => ({
        key: col.id,
        label: col.name,
        color: COLUMN_COLORS[col.color] ?? "bg-blue-500",
        count: countByColumn.get(col.id) ?? 0,
      }));
    },
  });
}

export function ConversionFunnel() {
  const { isStaff } = useAuth();
  const { data: stages, isLoading } = useFunnelData();

  if (!isStaff) return null;

  const maxCount = Math.max(...(stages?.map((s) => s.count) ?? [1]), 1);
  const totalLeads = stages?.reduce((s, st) => s + st.count, 0) ?? 0;
  const lastStageCount = stages?.[stages.length - 1]?.count ?? 0;

  return (
    <div
      className="bg-surface rounded-xl p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Funnel className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Funnel de conversion
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded-lg animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(stages ?? []).map((stage) => {
            const widthPercent =
              maxCount > 0 ? (stage.count / maxCount) * 100 : 0;

            return (
              <div key={stage.key} className="flex items-center gap-3">
                <span className="w-24 text-xs text-muted-foreground truncate shrink-0">
                  {stage.label}
                </span>
                <div className="flex-1 h-7 bg-muted/50 rounded-lg overflow-hidden relative">
                  <div
                    className={cn(
                      "h-full rounded-lg transition-all duration-700",
                      stage.color,
                    )}
                    style={{
                      width: `${Math.max(widthPercent, 4)}%`,
                      opacity: 0.85,
                    }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-[11px] font-semibold text-foreground">
                    {stage.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {stages && stages.length >= 2 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Taux global</span>
            <span className="font-semibold text-foreground">
              {totalLeads > 0
                ? Math.round((lastStageCount / totalLeads) * 100)
                : 0}
              %
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
