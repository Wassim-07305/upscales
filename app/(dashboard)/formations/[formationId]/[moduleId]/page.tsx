import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ModuleContent } from "./ModuleContent";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ formationId: string; moduleId: string }>;
}) {
  const { formationId, moduleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch module
  const { data: module } = await supabase
    .from("modules")
    .select("*")
    .eq("id", moduleId)
    .single();

  if (!module) notFound();

  // Check access
  const { data: enrollment } = await supabase
    .from("formation_enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("formation_id", formationId)
    .single();

  if (!enrollment && !module.is_preview) redirect(`/formations/${formationId}`);

  // Fetch progress
  const { data: progress } = await supabase
    .from("module_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .single();

  // Fetch all modules for navigation
  const { data: allModules } = await supabase
    .from("modules")
    .select("id, title, order")
    .eq("formation_id", formationId)
    .order("order");

  // Fetch formation title
  const { data: formation } = await supabase
    .from("formations")
    .select("title")
    .eq("id", formationId)
    .single();

  // If quiz module, fetch quiz data
  let quizData = null;
  if (module.type === "quiz") {
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("*")
      .eq("module_id", moduleId)
      .single();

    if (quiz) {
      const { data: questions } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quiz.id)
        .order("order");

      if (questions) {
        const questionIds = questions.map((q) => q.id);
        const { data: options } = await supabase
          .from("quiz_options")
          .select("*")
          .in("question_id", questionIds)
          .order("order");

        quizData = {
          quiz,
          questions: questions.map((q) => ({
            ...q,
            options: options?.filter((o) => o.question_id === q.id) || [],
          })),
        };
      }
    }
  }

  const modules = allModules || [];
  const currentIndex = modules.findIndex((m) => m.id === moduleId);
  const prevModule = currentIndex > 0 ? modules[currentIndex - 1] : null;
  const nextModule = currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null;

  return (
    <ModuleContent
      module={module}
      progress={progress}
      formationId={formationId}
      formationTitle={formation?.title || ""}
      prevModule={prevModule}
      nextModule={nextModule}
      quizData={quizData}
    />
  );
}
