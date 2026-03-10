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
  searchParams: Promise<{
    filter?: string;
    q?: string;
    difficulty?: string;
    duration?: string;
    category?: string;
  }>;
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

  // Fetch modules and enrollment counts (depends on formations result)
  const formationIds = formations?.map((f) => f.id) || [];
  const [{ data: modules }, { data: allEnrollments }] = await Promise.all([
    formationIds.length > 0
      ? supabase.from("modules").select("id, formation_id, duration_minutes").in("formation_id", formationIds)
      : Promise.resolve({ data: [] as { id: string; formation_id: string; duration_minutes: number }[] }),
    formationIds.length > 0
      ? supabase.from("formation_enrollments").select("formation_id").in("formation_id", formationIds)
      : Promise.resolve({ data: [] as { formation_id: string }[] }),
  ]);

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
      enrolledCount: allEnrollments?.filter((e) => e.formation_id === f.id).length || 0,
      enrolled: !!enrollment,
      progress: progressPercent,
      completed: enrollment?.completed_at != null,
    };
  }) || [];

  // Extract available categories
  const categories = [
    ...new Set(
      formations
        ?.map((f) => f.category)
        .filter((c): c is string => !!c) || []
    ),
  ].sort();

  // Filter
  const filter = params?.filter || "all";
  const searchQuery = params?.q?.toLowerCase() || "";
  const difficultyFilter = params?.difficulty || "all";
  const durationFilter = params?.duration || "all";
  const categoryFilter = params?.category || "all";
  let filtered = processedFormations;

  // Text search
  if (searchQuery) {
    filtered = filtered.filter(
      (f) =>
        f.title.toLowerCase().includes(searchQuery) ||
        f.description?.toLowerCase().includes(searchQuery)
    );
  }

  // Status filter
  if (filter === "in_progress") {
    filtered = filtered.filter((f) => f.enrolled && !f.completed && f.progress > 0);
  } else if (filter === "completed") {
    filtered = filtered.filter((f) => f.completed);
  } else if (filter === "free") {
    filtered = filtered.filter((f) => f.is_free);
  }

  // Difficulty filter
  if (difficultyFilter !== "all") {
    filtered = filtered.filter((f) => f.difficulty === difficultyFilter);
  }

  // Duration filter
  if (durationFilter !== "all") {
    filtered = filtered.filter((f) => {
      if (durationFilter === "short") return f.totalDuration < 60;
      if (durationFilter === "medium") return f.totalDuration >= 60 && f.totalDuration <= 180;
      if (durationFilter === "long") return f.totalDuration > 180;
      return true;
    });
  }

  // Category filter
  if (categoryFilter !== "all") {
    filtered = filtered.filter((f) => f.category === categoryFilter);
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

      <FormationsFilters
        currentFilter={filter}
        currentSearch={searchQuery}
        currentDifficulty={difficultyFilter}
        currentDuration={durationFilter}
        currentCategory={categoryFilter}
        categories={categories}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((formation) => (
          <FormationCard
            key={formation.id}
            formation={formation}
            moduleCount={formation.moduleCount}
            totalDuration={formation.totalDuration}
            enrolledCount={formation.enrolledCount}
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
