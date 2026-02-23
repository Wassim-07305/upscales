import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, CalendarDays, MessageCircle, TrendingUp, Activity } from "lucide-react";
import { isModerator } from "@/lib/utils/roles";
import { AdminCharts } from "./AdminCharts";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isModerator(profile.role)) redirect("/dashboard");

  // Parallelize all independent queries
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: totalFormations },
    { count: totalSessions },
    { count: totalMessages },
    { count: totalEnrollments },
    { count: totalCertificates },
    { count: activeUsers },
    { data: recentEnrollments },
    { data: recentPosts },
    { data: formations },
    { data: enrollmentData },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("formations").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("sessions").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase.from("formation_enrollments").select("*", { count: "exact", head: true }),
    supabase.from("certificates").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_seen_at", sevenDaysAgo),
    supabase.from("formation_enrollments").select("enrolled_at").order("enrolled_at", { ascending: true }),
    supabase.from("posts").select("*, author:profiles(full_name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("formations").select("id, title").eq("status", "published"),
    supabase.from("formation_enrollments").select("formation_id"),
  ]);

  // Completion rate
  const completionRate = totalEnrollments && totalCertificates
    ? Math.round(((totalCertificates || 0) / (totalEnrollments || 1)) * 100)
    : 0;

  const topFormations = formations?.map((f) => ({
    ...f,
    enrollments: enrollmentData?.filter((e) => e.formation_id === f.id).length || 0,
  })).sort((a, b) => b.enrollments - a.enrollments).slice(0, 5) || [];

  // Monthly data for charts
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.toLocaleString("fr-FR", { month: "short" });
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

    const count = recentEnrollments?.filter(
      (e) => e.enrolled_at >= monthStart && e.enrolled_at <= monthEnd
    ).length || 0;

    monthlyData.push({ month, inscriptions: count });
  }

  const stats = [
    { label: "Total élèves", value: totalUsers || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Élèves actifs", value: activeUsers || 0, icon: Activity, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Formations", value: totalFormations || 0, icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Sessions", value: totalSessions || 0, icon: CalendarDays, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Taux de complétion", value: `${completionRate}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Messages", value: totalMessages || 0, icon: MessageCircle, color: "text-pink-500", bg: "bg-pink-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble de la plateforme</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className={`p-2 rounded-lg ${stat.bg} mb-2`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminCharts
        monthlyData={monthlyData}
        topFormations={topFormations}
        recentPosts={recentPosts || []}
      />
    </div>
  );
}
