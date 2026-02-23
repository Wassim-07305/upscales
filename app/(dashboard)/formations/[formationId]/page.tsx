import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ModuleList } from "@/components/formations/ModuleList";
import { BookOpen, Clock, Users } from "lucide-react";
import { formatDuration } from "@/lib/utils/dates";
import { formatPrice } from "@/lib/utils/formatters";
import { EnrollButton } from "./EnrollButton";

export default async function FormationDetailPage({
  params,
}: {
  params: Promise<{ formationId: string }>;
}) {
  const { formationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [formationRes, modulesRes, enrollmentRes, progressRes, enrollCountRes] =
    await Promise.all([
      supabase.from("formations").select("*").eq("id", formationId).single(),
      supabase.from("modules").select("*").eq("formation_id", formationId).order("order"),
      supabase
        .from("formation_enrollments")
        .select("*")
        .eq("user_id", user.id)
        .eq("formation_id", formationId)
        .single(),
      supabase
        .from("module_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("formation_id", formationId),
      supabase
        .from("formation_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("formation_id", formationId),
    ]);

  const formation = formationRes.data;
  if (!formation) notFound();

  const modules = modulesRes.data || [];
  const enrollment = enrollmentRes.data;
  const progress = progressRes.data || [];
  const enrollCount = enrollCountRes.count || 0;

  const completedCount = progress.filter((p) => p.completed).length;
  const completionPercent =
    modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;
  const totalDuration = modules.reduce((sum, m) => sum + (m.duration_minutes || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
        {formation.thumbnail_url ? (
          <img
            src={formation.thumbnail_url}
            alt={formation.title}
            className="w-full h-48 md:h-64 object-cover opacity-50"
          />
        ) : (
          <div className="h-48 md:h-64" />
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-background/90 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={formation.is_free ? "secondary" : "default"}>
              {formation.is_free ? "Gratuit" : formation.price ? formatPrice(formation.price) : "Premium"}
            </Badge>
            {enrollment && (
              <Badge variant="outline" className="bg-neon/20 text-neon border-neon/30">
                Inscrit
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{formation.title}</h1>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {formation.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {formation.description}
                </p>
              </CardContent>
            </Card>
          )}

          {enrollment && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progression globale</span>
                <span className="text-sm text-muted-foreground">
                  {completedCount}/{modules.length} modules — {completionPercent}%
                </span>
              </div>
              <Progress value={completionPercent} className="h-2" />
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Modules ({modules.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <ModuleList
                modules={modules}
                progress={progress}
                formationId={formationId}
                enrolled={!!enrollment}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>{modules.length} modules</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatDuration(totalDuration)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{enrollCount} inscrits</span>
              </div>

              {!enrollment && (
                <EnrollButton formationId={formationId} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
