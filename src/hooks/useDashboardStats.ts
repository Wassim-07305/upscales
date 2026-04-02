import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { DashboardStats } from "@/types/database";

const supabase = createClient();

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    staleTime: 5 * 60 * 1000, // 5 min — donnees dashboard
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_stats");
      if (error) throw error;
      return data as DashboardStats;
    },
    refetchInterval: 60000, // refresh every minute
  });
}

export function useRevenueChart() {
  return useQuery({
    queryKey: ["revenue-chart"],
    staleTime: 5 * 60 * 1000, // 5 min — graphiques dashboard
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("stage", "close")
        .gte("updated_at", sixMonthsAgo.toISOString())
        .order("updated_at", { ascending: true })
        .returns<Array<Record<string, unknown> & { updated_at: string }>>();

      if (error) throw error;

      // Group by month using leads ca_contracté
      const monthlyData: Record<string, number> = {};
      for (const lead of data) {
        const month = lead.updated_at.substring(0, 7); // YYYY-MM
        monthlyData[month] =
          (monthlyData[month] ?? 0) +
          Number((lead as Record<string, unknown>)["ca_contracté"] ?? 0);
      }

      return Object.entries(monthlyData).map(([month, revenue]) => ({
        month,
        revenue,
      }));
    },
  });
}

export function useLeadsChart() {
  return useQuery({
    queryKey: ["leads-chart"],
    staleTime: 5 * 60 * 1000, // 5 min — graphiques dashboard
    queryFn: async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // Lire les closer_calls admin uniquement (pas ceux des clients)
      const { data, error } = await supabase
        .from("closer_calls")
        .select("date, status")
        .is("client_id", null)
        .gte("date", threeMonthsAgo.toISOString().split("T")[0])
        .order("date", { ascending: true })
        .returns<Array<{ date: string; status: string }>>();

      if (error) throw error;

      // Group by week avec les statuts d'Appels Closing
      const weeklyData: Record<
        string,
        { a_venir: number; close: number; non_qualifie: number; perdu: number }
      > = {};
      for (const call of data) {
        const d = new Date(call.date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay() + 1);
        const weekKey = weekStart.toISOString().split("T")[0];

        if (!weeklyData[weekKey])
          weeklyData[weekKey] = {
            a_venir: 0,
            close: 0,
            non_qualifie: 0,
            perdu: 0,
          };
        if (call.status === "a_venir") weeklyData[weekKey].a_venir++;
        else if (call.status === "close") weeklyData[weekKey].close++;
        else if (call.status === "non_qualifie")
          weeklyData[weekKey].non_qualifie++;
        else if (
          call.status === "perdu" ||
          call.status === "annule" ||
          call.status === "no_show"
        )
          weeklyData[weekKey].perdu++;
      }

      return Object.entries(weeklyData).map(([week, data]) => ({
        week,
        ...data,
      }));
    },
  });
}

export function useSetterActivityChart() {
  return useQuery({
    queryKey: ["setter-activity-chart"],
    staleTime: 5 * 60 * 1000, // 5 min — graphiques dashboard
    queryFn: async () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data, error } = await supabase
        .from("setter_activities")
        .select("date, messages_sent")
        .gte("date", twoWeeksAgo.toISOString().split("T")[0])
        .order("date", { ascending: true })
        .returns<Array<{ date: string; messages_sent: number }>>();

      if (error) throw error;

      // Group by date
      const dailyData: Record<string, number> = {};
      for (const activity of data) {
        dailyData[activity.date] =
          (dailyData[activity.date] ?? 0) + activity.messages_sent;
      }

      return Object.entries(dailyData).map(([date, messages]) => ({
        date,
        messages,
      }));
    },
  });
}
