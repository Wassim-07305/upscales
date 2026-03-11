"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Module, ModuleProgress, ModulePrerequisite } from "@/lib/types/database";
import { Video, FileText, HelpCircle, CheckCircle, Lock } from "lucide-react";
import { formatDuration } from "@/lib/utils/dates";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const typeIcons = {
  video_upload: Video,
  video_embed: Video,
  text: FileText,
  quiz: HelpCircle,
};

interface ModuleListProps {
  modules: Module[];
  progress: ModuleProgress[];
  formationId: string;
  enrolled: boolean;
  prerequisites?: ModulePrerequisite[];
}

export function ModuleList({ modules, progress, formationId, enrolled, prerequisites = [] }: ModuleListProps) {
  // Check if all prerequisites for a module are completed
  const arePrerequisitesComplete = (moduleId: string): boolean => {
    const modulePrereqs = prerequisites.filter((p) => p.module_id === moduleId);
    if (modulePrereqs.length === 0) return true;

    return modulePrereqs.every((prereq) => {
      const prereqProgress = progress.find((p) => p.module_id === prereq.prerequisite_module_id);
      return prereqProgress?.completed === true;
    });
  };

  // Get names of incomplete prerequisites
  const getIncompletePrerequisites = (moduleId: string): string[] => {
    const modulePrereqs = prerequisites.filter((p) => p.module_id === moduleId);
    return modulePrereqs
      .filter((prereq) => {
        const prereqProgress = progress.find((p) => p.module_id === prereq.prerequisite_module_id);
        return !prereqProgress?.completed;
      })
      .map((prereq) => {
        const prereqModule = modules.find((m) => m.id === prereq.prerequisite_module_id);
        return prereqModule?.title || "Module inconnu";
      });
  };

  return (
    <TooltipProvider>
      <div className="space-y-1">
        {modules.map((mod, index) => {
          const prog = progress.find((p) => p.module_id === mod.id);
          const isCompleted = prog?.completed;
          const prereqsComplete = arePrerequisitesComplete(mod.id);
          const incompletePrereqs = getIncompletePrerequisites(mod.id);
          const canAccess = (enrolled || mod.is_preview) && prereqsComplete;
          const isLockedByPrereqs = enrolled && !prereqsComplete;
          const Icon = typeIcons[mod.type];

        return (
          <div key={mod.id}>
            {canAccess ? (
              <Link
                href={`/formations/${formationId}/${mod.id}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-colors group",
                  isCompleted && "opacity-80"
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary flex-shrink-0 text-sm font-medium">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-neon" />
                  ) : (
                    <span className="text-muted-foreground">{index + 1}</span>
                  )}
                </div>
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {mod.title}
                  </p>
                  {mod.description && (
                    <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                  {mod.duration_minutes > 0 && (
                    <span>{formatDuration(mod.duration_minutes)}</span>
                  )}
                  {mod.is_preview && !enrolled && (
                    <span className="text-primary text-[10px] font-medium">APERÇU</span>
                  )}
                </div>
              </Link>
            ) : isLockedByPrereqs ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg opacity-50 cursor-not-allowed">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary flex-shrink-0">
                      <Lock className="h-4 w-4 text-amber-500" />
                    </div>
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{mod.title}</p>
                      <p className="text-xs text-amber-500/80">Prérequis requis</p>
                    </div>
                    {mod.duration_minutes > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(mod.duration_minutes)}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-xs font-medium mb-1">Complétez d'abord :</p>
                  <ul className="text-xs text-muted-foreground list-disc pl-3">
                    {incompletePrereqs.map((name, i) => (
                      <li key={i}>{name}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary flex-shrink-0">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{mod.title}</p>
                </div>
                {mod.duration_minutes > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(mod.duration_minutes)}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
      </div>
    </TooltipProvider>
  );
}
