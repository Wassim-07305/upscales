import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FormationCard } from "@/components/formations/FormationCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { isAdmin } from "@/lib/utils/roles";
import { FormationsFilters } from "./FormationsFilters";

export default async function FormationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Parallelize independent queries
  const [{ data: profile }, { data: formations }, { data: enrollments }, { data: progress }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase.from("formations").select("*").eq("status", "published").order("order"),
      supabase.from("formation_enrollments").select("*").eq("user_id", user.id),
      supabase.from("module_progress").select("*").eq("user_id", user.id),
    ]);

  // Fetch modules for counts (depends on formations result)
  const formationIds = formations?.map((f) => f.id) || [];
  const { data: modules } = formationIds.length > 0
    ? await supabase.from("modules").select("id, formation_id, duration_minutes").in("formation_id", formationIds)
    : { data: [] };

  // Process formations
  const processedFormations = formations?.map((f) => {
    const fModules = modules?.filter((m) => m.formation_id === f.id) || [];
    const enrollment = enrollments?.find((e) => e.formation_id === f.id);
    const fProgress = progress?.filter((p) => p.formation_id === f.id && p.completed) || [];
    const progressPercent = fModules.length > 0
      ? Math.round((fProgress.length / fModules.length) * 100)
      : 0;

    return {
      ...f,
      moduleCount: fModules.length,
      totalDuration: fModules.reduce((sum, m) => sum + (m.duration_minutes || 0), 0),
      enrolled: !!enrollment,
      progress: progressPercent,
      completed: enrollment?.completed_at != null,
    };
  }) || [];

  // Filter
  const filter = params?.filter || "all";
  let filtered = processedFormations;
  if (filter === "in_progress") {
    filtered = processedFormations.filter((f) => f.enrolled && !f.completed && f.progress > 0);
  } else if (filter === "completed") {
    filtered = processedFormations.filter((f) => f.completed);
  } else if (filter === "free") {
    filtered = processedFormations.filter((f) => f.is_free);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Formations</h1>
          <p className="text-muted-foreground">Développez vos compétences</p>
        </div>
        {profile && isAdmin(profile.role) && (
          <Link href="/admin/formations">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Gérer les formations
            </Button>
          </Link>
        )}
      </div>

      <FormationsFilters currentFilter={filter} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((formation) => (
          <FormationCard
            key={formation.id}
            formation={formation}
            moduleCount={formation.moduleCount}
            totalDuration={formation.totalDuration}
            progress={formation.enrolled ? formation.progress : undefined}
            enrolled={formation.enrolled}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucune formation trouvée</p>
        </div>
      )}
    </div>
  );
}
