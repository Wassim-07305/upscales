"use client";

import { useMemo } from "react";
import { useStudents, getStudentDetail } from "@/hooks/use-students";
import { useAllCheckins } from "@/hooks/use-checkins";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getMonday, toWeekStart } from "@/lib/checkin-utils";
import { addWeeks } from "date-fns";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const FLAG_CHART_DATA = [
  { flag: "red", name: "Critique", color: "#c6ff00" },
  { flag: "orange", name: "À risque", color: "#f97316" },
  { flag: "yellow", name: "Attention", color: "#f59e0b" },
  { flag: "green", name: "Bonne voie", color: "#10b981" },
] as const;

export function CoachInsightsCharts() {
  const { students } = useStudents({ limit: 200 });
  const { checkins } = useAllCheckins();

  // Répartition par flag
  const flagData = useMemo(() => {
    const counts: Record<string, number> = {
      red: 0,
      orange: 0,
      yellow: 0,
      green: 0,
    };
    for (const s of students) {
      const flag = getStudentDetail(s)?.flag ?? "green";
      counts[flag] = (counts[flag] ?? 0) + 1;
    }
    return FLAG_CHART_DATA.map((d) => ({
      ...d,
      value: counts[d.flag] ?? 0,
    })).filter((d) => d.value > 0);
  }, [students]);

  // Check-ins hebdo (6 dernières semaines)
  const weeklyData = useMemo(() => {
    const now = new Date();
    const weeks = Array.from({ length: 6 }, (_, i) => {
      const weekDate = addWeeks(now, i - 5);
      return toWeekStart(getMonday(weekDate));
    });

    const clientsPerWeek = new Map<string, Set<string>>();
    for (const week of weeks) clientsPerWeek.set(week, new Set());

    for (const c of checkins) {
      clientsPerWeek.get(c.week_start)?.add(c.client_id);
    }

    return weeks.map((week) => ({
      label: format(new Date(week + "T12:00:00"), "d MMM", { locale: fr }),
      count: clientsPerWeek.get(week)?.size ?? 0,
    }));
  }, [checkins]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Santé des élèves */}
      <div
        className="bg-surface rounded-xl p-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-[13px] font-semibold text-foreground mb-4">
          Santé des élèves
        </h3>
        {flagData.length === 0 ? (
          <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
            Pas de données
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie
                  data={flagData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={58}
                  strokeWidth={0}
                >
                  {flagData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 flex-1">
              {flagData.map((d) => (
                <div
                  key={d.flag}
                  className="flex items-center justify-between text-[12px]"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-muted-foreground">{d.name}</span>
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Check-ins hebdo */}
      <div
        className="bg-surface rounded-xl p-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-[13px] font-semibold text-foreground mb-4">
          Check-ins par semaine
        </h3>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={weeklyData} barSize={18}>
            <XAxis
              dataKey="label"
              tick={{
                fontSize: 10,
                fill: "var(--color-muted-foreground, #94a3b8)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
              }}
              formatter={(v: unknown) => [`${v as number}`, "Check-ins"]}
            />
            <Bar
              dataKey="count"
              fill="var(--color-primary, #6366f1)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
