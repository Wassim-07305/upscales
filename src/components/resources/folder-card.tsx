"use client";

import { cn } from "@/lib/utils";
import { Folder, MoreVertical, Trash2, Settings, FileText } from "lucide-react";
import { useState } from "react";
import type { ResourceFolder } from "@/types/database";

interface FolderCardProps {
  folder: ResourceFolder;
  onClick: () => void;
  isStaff: boolean;
  onDelete?: (id: string) => void;
  onPermissions?: (folder: ResourceFolder) => void;
}

const FOLDER_COLORS: Record<string, string> = {
  red: "from-lime-400/15 to-lime-400/5 border-lime-400/20 dark:border-lime-400/15",
  blue: "from-blue-500/15 to-blue-600/5 border-blue-500/20 dark:border-blue-500/15",
  green:
    "from-emerald-500/15 to-emerald-600/5 border-emerald-500/20 dark:border-emerald-500/15",
  purple:
    "from-purple-500/15 to-purple-600/5 border-purple-500/20 dark:border-purple-500/15",
  orange:
    "from-orange-500/15 to-orange-600/5 border-orange-500/20 dark:border-orange-500/15",
  yellow:
    "from-yellow-500/15 to-yellow-600/5 border-yellow-500/20 dark:border-yellow-500/15",
  pink: "from-pink-500/15 to-pink-600/5 border-pink-500/20 dark:border-pink-500/15",
};

const FOLDER_ICON_COLORS: Record<string, string> = {
  red: "text-lime-400",
  blue: "text-blue-600",
  green: "text-emerald-600",
  purple: "text-purple-600",
  orange: "text-orange-600",
  yellow: "text-yellow-600",
  pink: "text-pink-600",
};

export function FolderCard({
  folder,
  onClick,
  isStaff,
  onDelete,
  onPermissions,
}: FolderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const colorKey = folder.color ?? "blue";
  const gradientClass = FOLDER_COLORS[colorKey] ?? FOLDER_COLORS.blue;
  const iconColorClass =
    FOLDER_ICON_COLORS[colorKey] ?? FOLDER_ICON_COLORS.blue;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative bg-gradient-to-br border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group",
        gradientClass,
      )}
    >
      {isStaff && (
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="h-7 w-7 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-xl shadow-lg py-1 w-44">
                {onPermissions && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPermissions(folder);
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Permissions
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(folder.id);
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-error hover:bg-error/5 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="mb-3">
        {folder.icon ? (
          <span className="text-2xl">{folder.icon}</span>
        ) : (
          <Folder className={cn("w-8 h-8", iconColorClass)} />
        )}
      </div>

      <h3 className="text-sm font-semibold text-foreground truncate">
        {folder.name}
      </h3>
      {folder.description && (
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {folder.description}
        </p>
      )}

      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
        <FileText className="w-3 h-3" />
        <span>
          {folder.file_count ?? 0} fichier
          {(folder.file_count ?? 0) > 1 ? "s" : ""}
        </span>
      </div>

      {folder.visibility === "staff" && (
        <span className="absolute top-3 right-3 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
          Staff
        </span>
      )}
      {folder.visibility === "clients" && (
        <span className="absolute top-3 right-3 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20">
          Clients
        </span>
      )}
      {folder.visibility === "all" && (
        <span className="absolute top-3 right-3 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
          Tout le monde
        </span>
      )}
    </div>
  );
}
