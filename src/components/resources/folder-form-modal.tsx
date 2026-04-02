"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Folder } from "lucide-react";
import { Eye, Lock, Users } from "lucide-react";

const VISIBILITY_OPTIONS = [
  { value: "all" as const, label: "Tout le monde", icon: Eye },
  { value: "staff" as const, label: "Staff uniquement", icon: Lock },
  { value: "clients" as const, label: "Clients", icon: Users },
];

const COLOR_OPTIONS = [
  { value: "blue", label: "Bleu", class: "bg-blue-500" },
  { value: "red", label: "Rouge", class: "bg-lime-400" },
  { value: "green", label: "Vert", class: "bg-emerald-500" },
  { value: "purple", label: "Violet", class: "bg-purple-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "yellow", label: "Jaune", class: "bg-yellow-500" },
  { value: "pink", label: "Rose", class: "bg-pink-500" },
];

interface FolderFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    visibility: "all" | "staff" | "clients";
  }) => void;
  isPending?: boolean;
}

export function FolderFormModal({
  open,
  onClose,
  onSubmit,
  isPending,
}: FolderFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("blue");
  const [visibility, setVisibility] = useState<"all" | "staff" | "clients">(
    "all",
  );

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setColor("blue");
      setVisibility("all");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      visibility,
    });
    setName("");
    setDescription("");
    setColor("blue");
    setVisibility("all");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-[#c6ff00]" />
            <h2 className="text-lg font-semibold text-foreground">
              Nouveau dossier
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Nom
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du dossier"
            className="w-full h-9 px-3 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/20"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Description (optionnel)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve description..."
            className="w-full h-9 px-3 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Couleur
          </label>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={cn(
                  "w-7 h-7 rounded-full transition-all",
                  c.class,
                  color === c.value
                    ? "ring-2 ring-offset-2 ring-[#c6ff00] scale-110"
                    : "opacity-60 hover:opacity-100",
                )}
                title={c.label}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Visibilite
          </label>
          <div className="flex gap-2">
            {VISIBILITY_OPTIONS.map((v) => (
              <button
                key={v.value}
                onClick={() => setVisibility(v.value)}
                className={cn(
                  "h-8 px-3 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5",
                  visibility === v.value
                    ? "bg-gradient-to-r from-[#c6ff00] to-[#c6ff00] text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                <v.icon className="w-3 h-3" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isPending}
            className="h-9 px-4 bg-gradient-to-r from-[#c6ff00] to-[#c6ff00] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-[#c6ff00]/25 transition-all disabled:opacity-50"
          >
            {isPending ? "Creation..." : "Creer"}
          </button>
        </div>
      </div>
    </div>
  );
}
