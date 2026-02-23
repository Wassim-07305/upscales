"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, MapPin, Clock, Users, Calendar } from "lucide-react";
import { Session, UserRole } from "@/lib/types/database";
import { formatTime, formatDateTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SessionWithExtra extends Omit<Session, 'host'> {
  host?: { full_name: string; avatar_url: string | null };
  participants_count: number;
  is_registered: boolean;
}

interface CalendarClientProps {
  sessions: SessionWithExtra[];
  userId: string;
  userRole: UserRole;
}

export function CalendarClient({ sessions, userId, userRole }: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<SessionWithExtra | null>(null);
  const [registering, setRegistering] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSessionsForDay = (day: Date) =>
    sessions.filter((s) => isSameDay(new Date(s.start_time), day));

  const handleRegister = async (session: SessionWithExtra) => {
    setRegistering(true);
    if (session.is_registered) {
      await supabase
        .from("session_participants")
        .delete()
        .eq("session_id", session.id)
        .eq("user_id", userId);
      toast.success("Désinscription effectuée");
    } else {
      if (session.max_participants && session.participants_count >= session.max_participants) {
        toast.error("Session complète");
        setRegistering(false);
        return;
      }
      await supabase
        .from("session_participants")
        .insert({ session_id: session.id, user_id: userId });
      toast.success("Inscription confirmée !");
    }
    setRegistering(false);
    setSelectedSession(null);
    router.refresh();
  };

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendrier</h1>
        <p className="text-muted-foreground">Sessions et événements à venir</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg capitalize">
              {format(currentDate, "MMMM yyyy", { locale: fr })}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Aujourd&apos;hui
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week day headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {days.map((day) => {
              const daySessions = getSessionsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[80px] md:min-h-[100px] p-1.5 bg-card",
                    !isCurrentMonth && "opacity-40"
                  )}
                >
                  <div
                    className={cn(
                      "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                      isToday(day) && "bg-primary text-primary-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {daySessions.slice(0, 2).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSession(s)}
                        className="w-full text-left px-1 py-0.5 rounded text-[10px] font-medium truncate transition-opacity hover:opacity-80"
                        style={{ backgroundColor: s.color + "20", color: s.color }}
                      >
                        {formatTime(s.start_time)} {s.title}
                      </button>
                    ))}
                    {daySessions.length > 2 && (
                      <p className="text-[10px] text-muted-foreground px-1">
                        +{daySessions.length - 2} autres
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming sessions list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prochaines sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions
            .filter((s) => new Date(s.start_time) >= new Date() && s.status === "scheduled")
            .slice(0, 5)
            .map((session) => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="flex items-start gap-3 w-full p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
              >
                <div
                  className="w-1 h-full min-h-[48px] rounded-full flex-shrink-0"
                  style={{ backgroundColor: session.color }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{session.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(session.start_time)}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {session.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {session.participants_count}
                      {session.max_participants && `/${session.max_participants}`}
                    </span>
                  </div>
                </div>
                {session.is_registered && (
                  <Badge variant="outline" className="bg-neon/20 text-neon text-[10px]">
                    Inscrit
                  </Badge>
                )}
              </button>
            ))}
        </CardContent>
      </Card>

      {/* Session detail dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent>
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSession.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedSession.description && (
                  <p className="text-sm text-muted-foreground">{selectedSession.description}</p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatDateTime(selectedSession.start_time)} — {formatTime(selectedSession.end_time)}
                    </span>
                  </div>
                  {selectedSession.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedSession.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedSession.participants_count} participant(s)
                      {selectedSession.max_participants &&
                        ` / ${selectedSession.max_participants} places`}
                    </span>
                  </div>
                  {selectedSession.host && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Animé par {(selectedSession.host as any).full_name}</span>
                    </div>
                  )}
                </div>
                <Button
                  className="w-full"
                  variant={selectedSession.is_registered ? "outline" : "default"}
                  disabled={registering}
                  onClick={() => handleRegister(selectedSession)}
                >
                  {selectedSession.is_registered ? "Se désinscrire" : "S'inscrire"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
