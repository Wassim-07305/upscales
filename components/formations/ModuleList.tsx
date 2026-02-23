"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Module, ModuleProgress } from "@/lib/types/database";
import { Video, FileText, HelpCircle, CheckCircle, Play, Lock } from "lucide-react";
import { formatDuration } from "@/lib/utils/dates";

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
}

export function ModuleList({ modules, progress, formationId, enrolled }: ModuleListProps) {
  return (
    <div className="space-y-1">
      {modules.map((mod, index) => {
        const prog = progress.find((p) => p.module_id === mod.id);
        const isCompleted = prog?.completed;
        const canAccess = enrolled || mod.is_preview;
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
  );
}
