"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CALL_RESULTS,
  CALL_RESULT_LABELS,
  CALL_RESULT_COLORS,
  type CallResultType,
} from "@/lib/constants";
import { useUpdateBooking } from "@/hooks/use-booking-pages";
import { toast } from "sonner";

interface CallResultModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  prospectName: string;
  currentResult?: string | null;
  currentObjections?: string | null;
  currentNotes?: string | null;
  currentFollowUpDate?: string | null;
}

export function CallResultModal({
  open,
  onClose,
  bookingId,
  prospectName,
  currentResult,
  currentObjections,
  currentNotes,
  currentFollowUpDate,
}: CallResultModalProps) {
  const [callResult, setCallResult] = useState<CallResultType | "">("");
  const [objections, setObjections] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const updateBooking = useUpdateBooking();

  useEffect(() => {
    if (open) {
      setCallResult((currentResult as CallResultType) ?? "");
      setObjections(currentObjections ?? "");
      setFollowUpNotes(currentNotes ?? "");
      setFollowUpDate(currentFollowUpDate?.split("T")[0] ?? "");
    }
  }, [
    open,
    currentResult,
    currentObjections,
    currentNotes,
    currentFollowUpDate,
  ]);

  const handleSubmit = () => {
    if (!callResult) return;
    updateBooking.mutate(
      {
        id: bookingId,
        call_result: callResult,
        objections: objections || null,
        follow_up_notes: followUpNotes || null,
        follow_up_date: followUpDate
          ? new Date(followUpDate).toISOString()
          : null,
      },
      {
        onSuccess: () => {
          toast.success("Résultat enregistré");
          onClose();
        },
      },
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Résultat du call
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {prospectName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Résultat */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Résultat
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CALL_RESULTS.map((result) => (
                    <button
                      key={result}
                      type="button"
                      onClick={() => setCallResult(result)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                        callResult === result
                          ? cn(
                              CALL_RESULT_COLORS[result],
                              "border-transparent ring-2 ring-primary/20",
                            )
                          : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground",
                      )}
                    >
                      {CALL_RESULT_LABELS[result]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Objections */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Objections
                </label>
                <textarea
                  value={objections}
                  onChange={(e) => setObjections(e.target.value)}
                  placeholder="Quelles objections ont été soulevées ?"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Notes de suivi
                </label>
                <textarea
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Notes pour le prochain contact..."
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                />
              </div>

              {/* Date de rappel */}
              {callResult === "suivi_prévu" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Date de rappel
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!callResult || updateBooking.isPending}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {updateBooking.isPending
                    ? "Enregistrement..."
                    : "Enregistrer"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
