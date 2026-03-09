"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, CalendarCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AvailableSlot } from "@/lib/types/database";

interface TimeSlotPickerProps {
  slots: AvailableSlot[];
  selectedSlot: AvailableSlot | null;
  onSelectSlot: (slot: AvailableSlot) => void;
  onConfirm: () => void;
  loading: boolean;
  bookingLoading: boolean;
  brandColor: string;
  selectedDate: Date | null;
}

function formatSlotTime(time: string): string {
  // time est au format "HH:MM" ou "HH:MM:SS"
  return time.slice(0, 5);
}

export function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelectSlot,
  onConfirm,
  loading,
  bookingLoading,
  brandColor,
  selectedDate,
}: TimeSlotPickerProps) {
  // Pas de date selectionnee
  if (!selectedDate) {
    return (
      <Card className="gradient-border bg-[#141414]">
        <CardHeader>
          <CardTitle className="text-lg">Choisissez un créneau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarCheck className="size-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">
              Sélectionnez une date pour voir les créneaux disponibles.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dateLabel = format(selectedDate, "EEEE d MMMM", { locale: fr });

  return (
    <Card className="gradient-border bg-[#141414]">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          Créneaux disponibles
        </CardTitle>
        <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
      </CardHeader>
      <CardContent>
        {/* Chargement */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        )}

        {/* Aucun creneau */}
        {!loading && slots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="size-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">
              Aucun créneau disponible pour cette date.
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Essayez une autre date.
            </p>
          </div>
        )}

        {/* Grille de creneaux */}
        {!loading && slots.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slots.map((slot) => {
                const isSelected =
                  selectedSlot?.start_time === slot.start_time;

                return (
                  <button
                    key={slot.start_time}
                    type="button"
                    onClick={() => onSelectSlot(slot)}
                    className={cn(
                      "h-11 rounded-lg text-sm font-medium border transition-all duration-200",
                      !isSelected &&
                        "border-[#2A2A2A] text-foreground hover:border-[#3A3A3A] hover:bg-[#1C1C1C]",
                      isSelected && "border-transparent"
                    )}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${brandColor}18`,
                            color: brandColor,
                            borderColor: `${brandColor}50`,
                            boxShadow: `0 0 12px ${brandColor}15`,
                          }
                        : undefined
                    }
                  >
                    {formatSlotTime(slot.start_time)}
                  </button>
                );
              })}
            </div>

            {/* Bouton confirmer */}
            {selectedSlot && (
              <div className="pt-2 animate-fade-up">
                <Button
                  onClick={onConfirm}
                  disabled={bookingLoading}
                  className="w-full h-11 text-base font-semibold"
                  style={{
                    backgroundColor: brandColor,
                    color: "#0D0D0D",
                  }}
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Réservation en cours...
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="size-4" />
                      Confirmer — {formatSlotTime(selectedSlot.start_time)}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
