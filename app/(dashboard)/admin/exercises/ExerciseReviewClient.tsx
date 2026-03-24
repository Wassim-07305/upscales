"use client";

import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import ExerciseSubmissionDashboard from "@/components/exercises/ExerciseSubmissionDashboard";
import type { ExerciseSubmission } from "@/lib/exercises/exercise-types";

interface Props {
  submissions: ExerciseSubmission[];
  coachName: string;
}

export default function ExerciseReviewClient({ submissions, coachName }: Props) {
  const supabase = createClient();

  const handleGrade = async (id: string, grade: number, feedback: string) => {
    const { error } = await supabase
      .from("exercise_submissions")
      .update({
        status: "reviewed",
        grade,
        feedback,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast.error("Erreur lors de la correction");
    } else {
      toast.success("Exercice corrige");
    }
  };

  const handleRequestRevision = async (id: string, feedback: string) => {
    const { error } = await supabase
      .from("exercise_submissions")
      .update({
        status: "revision_requested",
        feedback,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast.error("Erreur lors de la demande de revision");
    } else {
      toast.success("Revision demandee");
    }
  };

  return (
    <ExerciseSubmissionDashboard
      submissions={submissions}
      coachName={coachName}
      onGrade={handleGrade}
      onRequestRevision={handleRequestRevision}
    />
  );
}
