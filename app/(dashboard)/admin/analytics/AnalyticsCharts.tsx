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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#222222",
  border: "1px solid #2A2A2A",
  borderRadius: "8px",
  fontSize: "12px",
};

const COLORS = ["#C6FF00", "#7FFFD4", "#FFB800", "#FF6B6B", "#A78BFA", "#38BDF8"];

interface AnalyticsChartsProps {
  completionRates: {
    formation: string;
    taux: number;
    inscrits: number;
    certifies: number;
  }[];
  enrollmentTrend: { mois: string; inscriptions: number }[];
  quizPerformance: {
    formation: string;
    scoreMoyen: number;
    tentatives: number;
  }[];
  weeklyEngagement: { semaine: string; utilisateurs: number }[];
  topStudents: { nom: string; modulesCompletes: number }[];
  formationPopularity: { formation: string; inscriptions: number }[];
}

export function AnalyticsCharts({
  completionRates,
  enrollmentTrend,
  quizPerformance,
  weeklyEngagement,
  topStudents,
  formationPopularity,
}: AnalyticsChartsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Taux de completion par formation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Taux de compl&eacute;tion par formation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completionRates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune donn&eacute;e disponible
            </p>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionRates}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis
                    dataKey="formation"
                    stroke="#a1a1aa"
                    fontSize={12}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#a1a1aa" fontSize={12} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: number | undefined) => [`${value ?? 0}%`, "Taux"]}
                  />
                  <Bar dataKey="taux" fill="#C6FF00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tendance des inscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Tendance des inscriptions (12 mois)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentTrend}>
                <defs>
                  <linearGradient id="colorInscriptions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C6FF00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C6FF00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="mois" stroke="#a1a1aa" fontSize={12} />
                <YAxis stroke="#a1a1aa" fontSize={12} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="inscriptions"
                  stroke="#C6FF00"
                  strokeWidth={2}
                  fill="url(#colorInscriptions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance des quiz */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance des quiz</CardTitle>
        </CardHeader>
        <CardContent>
          {quizPerformance.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune tentative de quiz
            </p>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quizPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis
                    dataKey="formation"
                    stroke="#a1a1aa"
                    fontSize={12}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#a1a1aa" fontSize={12} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={((value: number | undefined, name: string) => [
                      `${value ?? 0}%`,
                      name === "scoreMoyen" ? "Score moyen" : name,
                    ]) as any}
                  />
                  <Bar dataKey="scoreMoyen" fill="#7FFFD4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement hebdomadaire */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Engagement hebdomadaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyEngagement}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="semaine" stroke="#a1a1aa" fontSize={12} />
                <YAxis stroke="#a1a1aa" fontSize={12} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number | undefined) => [value ?? 0, "Utilisateurs actifs"]}
                />
                <Line
                  type="monotone"
                  dataKey="utilisateurs"
                  stroke="#7FFFD4"
                  strokeWidth={2}
                  dot={{ fill: "#7FFFD4", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Popularite des formations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Popularit&eacute; des formations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formationPopularity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune donn&eacute;e disponible
            </p>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formationPopularity.filter((f) => f.inscriptions > 0)}
                    dataKey="inscriptions"
                    nameKey="formation"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={(({ name, value }: Record<string, unknown>) =>
                      `${name} (${value})`
                    ) as any}
                    labelLine={false}
                    fontSize={11}
                  >
                    {formationPopularity
                      .filter((f) => f.inscriptions > 0)
                      .map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top eleves */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Top &eacute;l&egrave;ves
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune donn&eacute;e disponible
              </p>
            ) : (
              topStudents.map((student, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-5">
                    {i + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {student.nom}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {student.modulesCompletes} modules
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
