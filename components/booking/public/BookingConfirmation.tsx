"use client";

import Link from "next/link";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Calendar, Clock, User, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BookingResult {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  prospect_name: string;
}

interface BookingConfirmationProps {
  bookingResult: BookingResult;
  pageTitle: string | null;
  brandColor: string;
}

function formatSlotTime(time: string): string {
  return time.slice(0, 5);
}

export function BookingConfirmation({
  bookingResult,
  pageTitle,
  brandColor,
}: BookingConfirmationProps) {
  // Parse la date au format "YYYY-MM-DD"
  const dateObj = parse(bookingResult.date, "yyyy-MM-dd", new Date());
  const formattedDate = format(dateObj, "EEEE d MMMM yyyy", { locale: fr });

  return (
    <div className="text-center animate-fade-up">
      {/* Icone de succes */}
      <div
        className="inline-flex items-center justify-center size-20 rounded-full mb-6"
        style={{
          backgroundColor: `${brandColor}15`,
          boxShadow: `0 0 40px ${brandColor}20`,
        }}
      >
        <CheckCircle2
          className="size-10"
          style={{ color: brandColor }}
        />
      </div>

      {/* Titre */}
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">
        Réservation confirmée !
      </h2>
      <p className="text-muted-foreground text-sm mb-8">
        {pageTitle
          ? `Votre rendez-vous pour "${pageTitle}" a bien été enregistré.`
          : "Votre rendez-vous a bien été enregistré."}
      </p>

      {/* Carte recapitulative */}
      <Card className="gradient-border bg-[#141414] text-left">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center size-9 rounded-lg shrink-0"
              style={{ backgroundColor: `${brandColor}12` }}
            >
              <Calendar className="size-4" style={{ color: brandColor }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium text-foreground capitalize">
                {formattedDate}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center size-9 rounded-lg shrink-0"
              style={{ backgroundColor: `${brandColor}12` }}
            >
              <Clock className="size-4" style={{ color: brandColor }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Horaire</p>
              <p className="text-sm font-medium text-foreground">
                {formatSlotTime(bookingResult.start_time)} —{" "}
                {formatSlotTime(bookingResult.end_time)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center size-9 rounded-lg shrink-0"
              style={{ backgroundColor: `${brandColor}12` }}
            >
              <User className="size-4" style={{ color: brandColor }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nom</p>
              <p className="text-sm font-medium text-foreground">
                {bookingResult.prospect_name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lien retour */}
      <div className="mt-8">
        <Button asChild variant="outline" className="gap-2">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Retour à l&apos;accueil
          </Link>
        </Button>
      </div>
    </div>
  );
}
