"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Pencil, Trash2 } from "lucide-react";
import {
  useDashboardOverrides,
  DASHBOARD_OVERRIDE_KEYS,
  getOverrideLabel,
  type DashboardOverrides,
  type DashboardOverrideKey,
} from "@/hooks/use-dashboard-overrides";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Valeurs actuelles calculees par le dashboard (pre-remplissage) */
  currentValues: Record<DashboardOverrideKey, number>;
}

export function DashboardOverridesModal({
  open,
  onClose,
  currentValues,
}: Props) {
  const { overrides, isLoading, saveOverrides, isSaving } =
    useDashboardOverrides();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, string> = {};
    for (const key of DASHBOARD_OVERRIDE_KEYS) {
      // Override sauvegarde > valeur calculee > vide
      const saved = overrides[key];
      const current = currentValues[key];
      const value = saved !== null ? saved : current;
      initial[key] = value !== null && value !== undefined ? String(value) : "";
    }
    setForm(initial);
  }, [open, overrides, currentValues]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<DashboardOverrides> = {};
    for (const key of DASHBOARD_OVERRIDE_KEYS) {
      const val = form[key]?.trim();
      if (val === "" || val === undefined) {
        updates[key] = null;
      } else {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          updates[key] = num;
        }
      }
    }
    await saveOverrides(updates);
    onClose();
  };

  const clearField = (key: string) => {
    setForm((prev) => ({ ...prev, [key]: "" }));
  };

  const isPercent = (key: string) =>
    key.includes("rate") || key.includes("completion");

  const inputClass =
    "w-full h-10 px-4 bg-muted/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow tabular-nums";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative z-10 bg-surface rounded-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-border/50 sticky top-0 bg-surface rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Pencil className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-display font-semibold text-foreground">
                Modifier les donnees
              </h3>
              <p className="text-xs text-muted-foreground">
                Saisie manuelle des metriques
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <p className="text-xs text-muted-foreground">
              Renseignez les valeurs manuellement. Laissez vide pour utiliser
              les donnees automatiques de la plateforme.
            </p>

            {DASHBOARD_OVERRIDE_KEYS.map((key) => (
              <div key={key}>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  {getOverrideLabel(key as DashboardOverrideKey)}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={isPercent(key) ? "0.1" : "1"}
                    min="0"
                    max={isPercent(key) ? "100" : undefined}
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder="Automatique"
                    className={cn(inputClass, form[key] && "pr-10")}
                  />
                  {form[key] && (
                    <button
                      type="button"
                      onClick={() => clearField(key)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remettre en automatique"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="flex gap-3 pt-3">
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="h-10 px-5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
