"use client";

import { X, Shield } from "lucide-react";
import type { ResourceFolder } from "@/types/database";

interface FolderPermissionsModalProps {
  open: boolean;
  onClose: () => void;
  folder: ResourceFolder | null;
}

export function FolderPermissionsModal({
  open,
  onClose,
  folder,
}: FolderPermissionsModalProps) {
  if (!open || !folder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#c6ff00]" />
            <h2 className="text-lg font-semibold text-foreground">
              Permissions — {folder.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Visibilite actuelle :{" "}
              <span className="font-medium text-foreground">
                {folder.visibility === "all"
                  ? "Tout le monde"
                  : folder.visibility === "staff"
                    ? "Staff uniquement"
                    : "Clients"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
