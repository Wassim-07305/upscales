"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { VideoPlayer } from "@/components/formations/VideoPlayer";
import { QuizComponent } from "@/components/formations/QuizComponent";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  Video,
  FileText,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { Module, ModuleProgress, Quiz, QuizQuestion, QuizOption } from "@/lib/types/database";
import { showXPToast } from "@/components/gamification/XPToast";
import { ModuleNotes } from "@/components/formations/ModuleNotes";

const typeIcons: Record<string, typeof Video> = {
  video_upload: Video,
  video_embed: Video,
  text: FileText,
  quiz: HelpCircle,
};

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
  allModules: { id: string; title: string; order: number; type: string; duration_minutes: number }[];
  allProgress: { module_id: string; completed: boolean }[];
  initialNoteContent: string;
}

export function ModuleContent({
  module,
  progress,
  formationId,
  formationTitle,
  prevModule,
  nextModule,
  quizData,
  allModules,
  allProgress,
  initialNoteContent,
}: ModuleContentProps) {
  const router = useRouter();
  const supabase = createClient();
  const [completed, setCompleted] = useState(progress?.completed || false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const completedCount = allProgress.filter((p) => p.completed).length + (completed && !allProgress.find((p) => p.module_id === module.id)?.completed ? 1 : 0);
  const totalModules = allModules.length;
  const completionPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

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

      // Attribuer XP pour le module complété
      try {
        const xpRes = await fetch("/api/xp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "module_complete" }),
        });
        if (xpRes.ok) {
          const xpData = await xpRes.json();
          showXPToast(xpData.xp_awarded, xpData.new_badges?.[0]?.name);
        }
      } catch { /* XP non bloquant */ }

      const { data: allModulesCheck } = await supabase
        .from("modules")
        .select("id")
        .eq("formation_id", formationId);

      const { data: allProgressCheck } = await supabase
        .from("module_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("formation_id", formationId)
        .eq("completed", true);

      if (allModulesCheck && allProgressCheck && allProgressCheck.length >= allModulesCheck.length) {
        const certNumber = `UPS-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        await supabase.from("certificates").insert({
          user_id: user.id,
          formation_id: formationId,
          certificate_number: certNumber,
        });

        await supabase.from("formation_enrollments").update({
          completed_at: new Date().toISOString(),
        }).eq("user_id", user.id).eq("formation_id", formationId);

        // Notification de formation complétée + certificat
        await supabase.from("notifications").insert([
          {
            user_id: user.id,
            type: "formation" as const,
            title: "Formation terminée !",
            message: `Vous avez terminé "${formationTitle}". Bravo !`,
            link: `/formations/${formationId}`,
          },
          {
            user_id: user.id,
            type: "certificate" as const,
            title: "Certificat obtenu",
            message: `Votre certificat pour "${formationTitle}" est disponible.`,
            link: "/certificates",
          },
        ]);

        // Notifier les admins de la complétion
        const { data: admins } = await supabase
          .from("profiles")
          .select("id")
          .in("role", ["admin", "moderator"]);

        if (admins && admins.length > 0) {
          const { data: studentProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          await supabase.from("notifications").insert(
            admins
              .filter((a) => a.id !== user.id)
              .map((admin) => ({
                user_id: admin.id,
                type: "formation" as const,
                title: `${studentProfile?.full_name || "Un élève"} a terminé une formation`,
                message: `"${formationTitle}" — certificat délivré`,
                link: `/admin/crm/${user.id}`,
              }))
          );
        }

        // Attribuer XP pour la formation complétée
        try {
          const xpRes = await fetch("/api/xp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "formation_complete" }),
          });
          if (xpRes.ok) {
            const xpData = await xpRes.json();
            showXPToast(xpData.xp_awarded, xpData.new_badges?.[0]?.name);
          }
        } catch { /* XP non bloquant */ }

        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#C6FF00", "#7FFFD4", "#ffffff", "#a3e635"],
        });

        toast.success("Félicitations ! Formation terminée !", {
          description: "Votre certificat a été généré.",
        });
      }
    }
  };

  const handleTimeUpdate = useCallback(
    async (seconds: number) => {
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
    [module.id, formationId, supabase]
  );

  const handleVideoComplete = async () => {
    if (!completed) {
      await handleMarkCompleted();
    }
  };

  return (
    <div className="flex gap-6 max-w-7xl mx-auto">
      {/* Sidebar */}
      <aside
        className={cn(
          "shrink-0 transition-all duration-300 hidden lg:block",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        )}
      >
        <div className="sticky top-4 space-y-3">
          {/* Formation link */}
          <Link
            href={`/formations/${formationId}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="truncate">{formationTitle}</span>
          </Link>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{completedCount}/{totalModules} modules</span>
              <span>{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} className="h-1.5" />
          </div>

          {/* Module list */}
          <div className="space-y-0.5 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
            {allModules.map((mod, index) => {
              const isCompleted = mod.id === module.id ? completed : allProgress.find((p) => p.module_id === mod.id)?.completed;
              const isCurrent = mod.id === module.id;
              const Icon = typeIcons[mod.type] || FileText;

              return (
                <Link
                  key={mod.id}
                  href={`/formations/${formationId}/${mod.id}`}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isCurrent
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-neon" />
                    ) : (
                      <span className={cn("text-xs font-medium", isCurrent && "text-primary")}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  <span className="truncate flex-1 text-[13px]">{mod.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 hidden lg:flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>

          {/* Mobile breadcrumb */}
          <Link
            href={`/formations/${formationId}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
            {formationTitle}
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold truncate">{module.title}</h1>
              {completed && (
                <Badge className="bg-neon/20 text-neon border-neon/30 shrink-0">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Terminé
                </Badge>
              )}
            </div>
            {module.description && (
              <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
            )}
          </div>

          {/* Mobile progress */}
          <div className="lg:hidden text-xs text-muted-foreground shrink-0">
            {completedCount}/{totalModules}
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="lg:hidden">
          <Progress value={completionPercent} className="h-1.5" />
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
            onComplete={async (passed) => {
              if (passed) {
                // XP pour quiz réussi
                try {
                  const xpRes = await fetch("/api/xp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "quiz_pass" }),
                  });
                  if (xpRes.ok) {
                    const xpData = await xpRes.json();
                    showXPToast(xpData.xp_awarded, xpData.new_badges?.[0]?.name);
                  }
                } catch { /* XP non bloquant */ }
                if (!completed) {
                  handleMarkCompleted();
                }
              }
            }}
          />
        )}

        {/* Notes */}
        <ModuleNotes
          moduleId={module.id}
          formationId={formationId}
          initialContent={initialNoteContent}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex gap-2">
            {!completed && module.type !== "quiz" && (
              <Button onClick={handleMarkCompleted} variant="outline" size="sm">
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
                  <span className="hidden sm:inline">Précédent</span>
                </Button>
              </Link>
            )}
            {nextModule && (
              <Link href={`/formations/${formationId}/${nextModule.id}`}>
                <Button size="sm">
                  <span className="hidden sm:inline">Suivant</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            {!nextModule && completed && (
              <Link href={`/formations/${formationId}`}>
                <Button size="sm" variant="outline">
                  Retour à la formation
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
