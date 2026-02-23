"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { timeAgo } from "@/lib/utils/dates";

interface AdminChartsProps {
  monthlyData: { month: string; inscriptions: number }[];
  topFormations: { id: string; title: string; enrollments: number }[];
  recentPosts: any[];
}

export function AdminCharts({ monthlyData, topFormations, recentPosts }: AdminChartsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Enrollment chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inscriptions par mois</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" />
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} />
                <YAxis stroke="#a1a1aa" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a23",
                    border: "1px solid #2a2a35",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="inscriptions"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: "#6366f1" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top formations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top formations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topFormations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune formation</p>
            ) : (
              topFormations.map((f, i) => (
                <div key={f.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-5">
                    {i + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.title}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {f.enrollments} inscrits
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité récente</p>
            ) : (
              recentPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{(post.author as any)?.full_name}</span>
                      {" a publié un post"}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
