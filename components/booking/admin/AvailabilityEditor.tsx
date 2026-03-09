"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Clock } from "lucide-react";
import { BookingAvailability } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface AvailabilityEditorProps {
  bookingPageId: string;
  availability: BookingAvailability[];
}

const DAY_LABELS: Record<number, string> = {
  0: "Dimanche",
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
};

// Jours dans l'ordre Lundi -> Dimanche
const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0];

export function AvailabilityEditor({
  bookingPageId,
  availability,
}: AvailabilityEditorProps) {
  const router = useRouter();
  const [newDay, setNewDay] = useState("1");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");
  const [loading, setLoading] = useState(false);

  const grouped = ORDERED_DAYS.map((day) => ({
    day,
    label: DAY_LABELS[day],
    slots: availability
      .filter((a) => a.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  })).filter((g) => g.slots.length > 0);

  async function handleAdd() {
    if (newStart >= newEnd) {
      toast.error("L'heure de fin doit être après l'heure de début");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("booking_availability").insert({
        booking_page_id: bookingPageId,
        day_of_week: parseInt(newDay),
        start_time: newStart,
        end_time: newEnd,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Créneau ajouté");
      router.refresh();
    } catch {
      toast.error("Erreur lors de l'ajout du créneau");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(slotId: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("booking_availability")
        .delete()
        .eq("id", slotId);

      if (error) throw error;

      toast.success("Créneau supprimé");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1">Créneaux disponibles</h3>
        <p className="text-xs text-muted-foreground">
          Définissez vos plages horaires de disponibilité par jour de la semaine.
        </p>
      </div>

      {/* Créneaux existants groupés par jour */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <Clock className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">Aucun créneau configuré</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map((group) => (
            <Card key={group.day} className="bg-[#141414] border-[#2A2A2A]">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold mb-2">{group.label}</p>
                <div className="space-y-2">
                  {group.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between bg-[#0D0D0D] rounded-lg px-3 py-2"
                    >
                      <span className="text-sm font-mono">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(slot.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulaire d'ajout */}
      <Card className="bg-[#141414] border-[#2A2A2A]">
        <CardContent className="pt-4">
          <p className="text-sm font-semibold mb-3">Ajouter un créneau</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Jour</Label>
              <Select value={newDay} onValueChange={setNewDay}>
                <SelectTrigger className="bg-[#0D0D0D] border-[#2A2A2A]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDERED_DAYS.map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      {DAY_LABELS[day]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Début</Label>
              <Input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="bg-[#0D0D0D] border-[#2A2A2A]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fin</Label>
              <Input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="bg-[#0D0D0D] border-[#2A2A2A]"
              />
            </div>
            <Button onClick={handleAdd} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
