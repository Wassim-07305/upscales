// src/components/dashboard/coach-upcoming-sessions.tsx
"use client";

import { useMemo } from "react";
import { useUpcomingSessions } from "@/hooks/use-sessions";
import { useAllCheckins } from "@/hooks/use-checkins";
import { MOOD_CONFIG } from "@/types/coaching";
import type { Mood } from "@/types/coaching";
import { getInitials } from "@/lib/utils";
import { CalendarClock } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function CoachUpcomingSessions() {
  const { data: sessions = [], isLoading: sessionsLoading } =
    useUpcomingSessions();
  const { checkins, isLoading: checkinsLoading } = useAllCheckins();

  // Dernière humeur par élève (client_id → mood)
  const lastMoodByClient = useMemo(() => {
    const map = new Map<string, Mood>();
    const sorted = [...checkins].sort((a, b) =>
      b.week_start.localeCompare(a.week_start),
    );
    for (const c of sorted) {
      if (c.mood !== null && !map.has(c.client_id)) {
        map.set(c.client_id, c.mood);
      }
    }
    return map;
  }, [checkins]);

  const upcoming = sessions.slice(0, 3);

  if (sessionsLoading || checkinsLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-xl p-4 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-2 w-16 bg-muted rounded" />
              </div>
            </div>
            <div className="h-3 w-32 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Cas 0 session : une seule div pleine largeur
  if (upcoming.length === 0) {
    return (
      <div
        className="bg-surface border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[88px] gap-2"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <CalendarClock className="w-6 h-6 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Aucune session planifiée
        </p>
      </div>
    );
  }

  // Remplir jusqu'à 3 avec des cartes vides
  const cards = [
    ...upcoming,
    ...Array(Math.max(0, 3 - upcoming.length)).fill(null),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((session, i) => {
        if (!session) {
          return (
            <div
              key={`empty-${i}`}
              className="bg-surface border border-dashed border-border rounded-xl p-4 flex items-center justify-center min-h-[88px]"
            >
              <p className="text-[12px] text-muted-foreground/50">
                Aucune session planifiée
              </p>
            </div>
          );
        }

        const client = session.client;
        const mood = client ? lastMoodByClient.get(client.id) : undefined;
        const moodConfig = mood ? MOOD_CONFIG[mood] : null;
        const scheduledAt = new Date(session.scheduled_at);

        return (
          <div
            key={session.id}
            className="bg-surface border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-[11px] text-primary font-medium shrink-0">
                {client?.avatar_url ? (
                  <Image
                    src={client.avatar_url}
                    alt={client.full_name}
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  getInitials(client?.full_name ?? "?")
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">
                  {client?.full_name ?? "Élève inconnu"}
                </p>
              </div>
              {/* Mood du dernier check-in */}
              {moodConfig && (
                <span
                  className="text-base shrink-0"
                  title={`Humeur : ${moodConfig.label}`}
                >
                  {moodConfig.emoji}
                </span>
              )}
            </div>

            {/* Date + heure */}
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <CalendarClock className="w-3.5 h-3.5 shrink-0" />
              <span>
                {format(scheduledAt, "EEE d MMM 'à' HH'h'mm", { locale: fr })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
