"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, CalendarOff } from "lucide-react";
import { BookingException } from "@/lib/types/database";
import { formatDate } from "@/lib/utils/dates";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ExceptionEditorProps {
  bookingPageId: string;
  exceptions: BookingException[];
}

export function ExceptionEditor({
  bookingPageId,
  exceptions,
}: ExceptionEditorProps) {
  const router = useRouter();
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!newDate) {
      toast.error("Veuillez sélectionner une date");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("booking_exceptions").insert({
        booking_page_id: bookingPageId,
        exception_date: newDate,
        type: "blocked" as const,
        reason: newReason || null,
      });

      if (error) throw error;

      toast.success("Date bloquée ajoutée");
      setNewDate("");
      setNewReason("");
      router.refresh();
    } catch {
      toast.error("Erreur lors de l'ajout de l'exception");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(exceptionId: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("booking_exceptions")
        .delete()
        .eq("id", exceptionId);

      if (error) throw error;

      toast.success("Exception supprimée");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1">Dates bloquées</h3>
        <p className="text-xs text-muted-foreground">
          Bloquez des dates spécifiques pour empêcher toute réservation (vacances, jours fériés...).
        </p>
      </div>

      {/* Exceptions existantes */}
      {exceptions.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <CalendarOff className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">Aucune date bloquée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exceptions.map((exception) => (
            <div
              key={exception.id}
              className="flex items-center justify-between bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {formatDate(exception.exception_date)}
                </p>
                {exception.reason && (
                  <p className="text-xs text-muted-foreground">
                    {exception.reason}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(exception.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire d'ajout */}
      <Card className="bg-[#141414] border-[#2A2A2A]">
        <CardContent className="pt-4">
          <p className="text-sm font-semibold mb-3">Bloquer une date</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-[#0D0D0D] border-[#2A2A2A]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Raison (optionnel)</Label>
              <Input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Ex : Jour férié"
                className="bg-[#0D0D0D] border-[#2A2A2A]"
              />
            </div>
            <Button onClick={handleAdd} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              Bloquer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
