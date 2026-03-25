import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubNav } from "@/components/layout/sub-nav";
import ExerciseReviewClient from "./ExerciseReviewClient";
import type { ExerciseSubmission, SubmissionStatus } from "@/lib/exercises/exercise-types";

const formationsTabs = [
  { label: "Formations", href: "/admin/formations" },
  { label: "Playbooks", href: "/admin/playbooks" },
  { label: "Ressources", href: "/ressources" },
  { label: "Pages", href: "/admin/pages" },
  { label: "Exercices", href: "/admin/exercises" },
  { label: "Contenu", href: "/admin/content" },
];

export default async function AdminExercisesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: submissions } = await supabase
    .from("exercise_submissions")
    .select(`
      *,
      student:profiles!exercise_submissions_user_id_fkey(full_name, email),
      module:modules!exercise_submissions_module_id_fkey(title),
      formation:formations!exercise_submissions_formation_id_fkey(title)
    `)
    .order("submitted_at", { ascending: false })
    .limit(100);

  const mapped: ExerciseSubmission[] = (submissions || []).map((s: any) => ({
    id: s.id,
    lessonId: s.module_id,
    studentId: s.user_id,
    studentName: s.student?.full_name || s.student?.email || "Inconnu",
    lessonTitle: `${s.formation?.title || "Formation"} — ${s.module?.title || "Module"}`,
    content: s.content || "",
    attachments: s.attachments || [],
    status: (s.status === "pending" ? "submitted" : s.status === "reviewed" ? "reviewed" : "revision_requested") as SubmissionStatus,
    coachFeedback: s.feedback,
    grade: s.grade,
    reviewedBy: null,
    reviewedAt: s.reviewed_at,
    submittedAt: s.submitted_at,
  }));

  return (
    <>
      <SubNav tabs={formationsTabs} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Corrections d&apos;exercices</h1>
          <p className="text-muted-foreground">Corrigez les soumissions de vos eleves</p>
        </div>
        <ExerciseReviewClient
          submissions={mapped}
          coachName={profile.full_name || "Admin"}
        />
      </div>
    </>
  );
}
