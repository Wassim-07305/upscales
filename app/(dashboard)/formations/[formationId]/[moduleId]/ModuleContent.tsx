"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/formations/VideoPlayer";
import { QuizComponent } from "@/components/formations/QuizComponent";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Module, ModuleProgress, Quiz, QuizQuestion, QuizOption } from "@/lib/types/database";

interface ModuleContentProps {
  module: Module;
  progress: ModuleProgress | null;
  formationId: string;
  formationTitle: string;
  prevModule: { id: string; title: string } | null;
  nextModule: { id: string; title: string } | null;
  quizData: {
    quiz: Quiz;
    questions: (QuizQuestion & { options: QuizOption[] })[];
  } | null;
}

export function ModuleContent({
  module,
  progress,
  formationId,
  formationTitle,
  prevModule,
  nextModule,
  quizData,
}: ModuleContentProps) {
  const router = useRouter();
  const supabase = createClient();
  const [completed, setCompleted] = useState(progress?.completed || false);

  const handleMarkCompleted = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("module_progress").upsert(
      {
        user_id: user.id,
        module_id: module.id,
        formation_id: formationId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,module_id" }
    );

    if (!error) {
      setCompleted(true);
      toast.success("Module marqué comme terminé !");

      // Check if all modules are completed for certificate
      const { data: allModules } = await supabase
        .from("modules")
        .select("id")
        .eq("formation_id", formationId);

      const { data: allProgress } = await supabase
        .from("module_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("formation_id", formationId)
        .eq("completed", true);

      if (allModules && allProgress && allProgress.length >= allModules.length) {
        // All modules completed - create certificate
        const certNumber = `UPS-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        await supabase.from("certificates").insert({
          user_id: user.id,
          formation_id: formationId,
          certificate_number: certNumber,
        });

        await supabase.from("formation_enrollments").update({
          completed_at: new Date().toISOString(),
        }).eq("user_id", user.id).eq("formation_id", formationId);

        toast.success("Félicitations ! Formation terminée !", {
          description: "Votre certificat a été généré.",
        });
      }
    }
  };

  const handleTimeUpdate = useCallback(
    async (seconds: number) => {
      // Throttle updates to every 10 seconds
      if (seconds % 10 !== 0) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("module_progress").upsert(
        {
          user_id: user.id,
          module_id: module.id,
          formation_id: formationId,
          last_position_seconds: seconds,
        },
        { onConflict: "user_id,module_id" }
      );
    },
    [module.id, formationId]
  );

  const handleVideoComplete = async () => {
    if (!completed) {
      await handleMarkCompleted();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href={`/formations/${formationId}`}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {formationTitle}
        </Link>
      </div>

      {/* Module Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{module.title}</h1>
          {module.description && (
            <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
          )}
        </div>
        {completed && (
          <Badge className="bg-neon/20 text-neon border-neon/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Terminé
          </Badge>
        )}
      </div>

      {/* Content */}
      {(module.type === "video_upload" || module.type === "video_embed") && module.video_url && (
        <>
          {module.type === "video_upload" ? (
            <VideoPlayer
              url={module.video_url}
              startPosition={progress?.last_position_seconds || 0}
              onTimeUpdate={handleTimeUpdate}
              onComplete={handleVideoComplete}
            />
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <iframe
                src={module.video_url}
                className="w-full aspect-video"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </>
      )}

      {module.type === "text" && module.content && (
        <Card>
          <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: module.content }} />
          </CardContent>
        </Card>
      )}

      {module.type === "quiz" && quizData && (
        <QuizComponent
          quiz={quizData.quiz}
          questions={quizData.questions}
          onComplete={(passed) => {
            if (passed && !completed) {
              handleMarkCompleted();
            }
          }}
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex gap-2">
          {!completed && module.type !== "quiz" && (
            <Button onClick={handleMarkCompleted} variant="outline">
              <CheckCircle className="mr-2 h-4 w-4" />
              Marquer comme terminé
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {prevModule && (
            <Link href={`/formations/${formationId}/${prevModule.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Précédent
              </Button>
            </Link>
          )}
          {nextModule && (
            <Link href={`/formations/${formationId}/${nextModule.id}`}>
              <Button size="sm">
                Suivant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
