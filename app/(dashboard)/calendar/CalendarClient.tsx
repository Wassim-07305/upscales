"use client";

import { useState, useMemo } from "react";
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
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isToday,
  eachHourOfInterval,
  startOfDay,
  endOfDay,
  getHours,
  getMinutes,
  differenceInMinutes,
  isBefore,
  isAfter,
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
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Users,
  Calendar,
  CalendarPlus,
  Filter,
  X,
  LayoutGrid,
  Columns3,
  CalendarDays,
} from "lucide-react";
import { Session, UserRole } from "@/lib/types/database";
import { formatTime, formatDateTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SessionWithExtra extends Omit<Session, "host"> {
  host?: { full_name: string; avatar_url: string | null };
  participants_count: number;
  is_registered: boolean;
}

interface CalendarClientProps {
  sessions: SessionWithExtra[];
  userId: string;
  userRole: UserRole;
}

type ViewMode = "month" | "week" | "day";

const STATUS_OPTIONS = [
  { value: "scheduled", label: "A venir" },
  { value: "completed", label: "Passees" },
  { value: "cancelled", label: "Annulees" },
];

const TYPE_OPTIONS = [
  { value: "online", label: "En ligne" },
  { value: "physical", label: "Physique" },
  { value: "hybrid", label: "Hybride" },
];

export function CalendarClient({
  sessions,
  userId,
  userRole,
}: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedSession, setSelectedSession] =
    useState<SessionWithExtra | null>(null);
  const [registering, setRegistering] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterRegistered, setFilterRegistered] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filterStatus.length > 0 && !filterStatus.includes(s.status || "scheduled"))
        return false;
      if (filterType.length > 0) {
        const type = s.location?.includes("http") ? "online" : s.location ? "physical" : "online";
        if (!filterType.includes(type)) return false;
      }
      if (filterRegistered && !s.is_registered) return false;
      return true;
    });
  }, [sessions, filterStatus, filterType, filterRegistered]);

  const activeFilterCount =
    filterStatus.length + filterType.length + (filterRegistered ? 1 : 0);

  // Navigation
  const goNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const goPrev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  const getTitle = () => {
    if (viewMode === "month")
      return format(currentDate, "MMMM yyyy", { locale: fr });
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(ws, "d MMM", { locale: fr })} — ${format(we, "d MMM yyyy", { locale: fr })}`;
    }
    return format(currentDate, "EEEE d MMMM yyyy", { locale: fr });
  };

  // Month view data
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Week view data
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Hours for week/day view (7h-22h)
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);

  const getSessionsForDay = (day: Date) =>
    filteredSessions.filter((s) => isSameDay(new Date(s.start_time), day));

  const getSessionPosition = (session: SessionWithExtra) => {
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    const h = getHours(start);
    const m = getMinutes(start);
    const top = (h - 7) * 60 + m;
    const height = Math.max(differenceInMinutes(end, start), 30);
    return { top, height };
  };

  const toggleFilter = (
    arr: string[],
    setArr: (v: string[]) => void,
    val: string
  ) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const clearFilters = () => {
    setFilterStatus([]);
    setFilterType([]);
    setFilterRegistered(false);
  };

  const handleRegister = async (session: SessionWithExtra) => {
    setRegistering(true);
    if (session.is_registered) {
      await supabase
        .from("session_participants")
        .delete()
        .eq("session_id", session.id)
        .eq("user_id", userId);
      toast.success("Desinscription effectuee");
    } else {
      if (
        session.max_participants &&
        session.participants_count >= session.max_participants
      ) {
        toast.error("Session complete");
        setRegistering(false);
        return;
      }
      await supabase
        .from("session_participants")
        .insert({ session_id: session.id, user_id: userId });

      await supabase.from("notifications").insert({
        user_id: userId,
        type: "session",
        title: `Inscription confirmee : ${session.title}`,
        message: `Vous etes inscrit a la session du ${formatDateTime(session.start_time)}`,
        link: "/calendar",
      });

      if (session.host_id && session.host_id !== userId) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();

        await supabase.from("notifications").insert({
          user_id: session.host_id,
          type: "session",
          title: `Nouvelle inscription : ${session.title}`,
          message: `${userProfile?.full_name || "Un utilisateur"} s'est inscrit a votre session`,
          link: "/admin/calendar",
        });
      }

      toast.success("Inscription confirmee !");
    }
    setRegistering(false);
    setSelectedSession(null);
    router.refresh();
  };

  const weekDayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Session pill component
  const SessionPill = ({
    session,
    compact = false,
  }: {
    session: SessionWithExtra;
    compact?: boolean;
  }) => (
    <button
      onClick={() => setSelectedSession(session)}
      className={cn(
        "w-full text-left rounded font-medium truncate transition-opacity hover:opacity-80",
        compact ? "px-1 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
      )}
      style={{ backgroundColor: (session.color || "#C6FF00") + "20", color: session.color || "#C6FF00" }}
    >
      {formatTime(session.start_time)} {session.title}
      {!compact && session.is_registered && (
        <span className="ml-1 opacity-60">• Inscrit</span>
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Calendrier</h1>
          <p className="text-muted-foreground text-sm">
            Sessions et evenements
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex bg-card border rounded-lg p-0.5">
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setViewMode("month")}
            >
              <LayoutGrid className="h-3 w-3" />
              Mois
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setViewMode("week")}
            >
              <Columns3 className="h-3 w-3" />
              Semaine
            </Button>
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setViewMode("day")}
            >
              <CalendarDays className="h-3 w-3" />
              Jour
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 relative"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3 w-3" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Filtres</p>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={clearFilters}
                >
                  <X className="h-3 w-3 mr-1" />
                  Reinitialiser
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Statut</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      toggleFilter(filterStatus, setFilterStatus, opt.value)
                    }
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs border transition-colors",
                      filterStatus.includes(opt.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Type</p>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      toggleFilter(filterType, setFilterType, opt.value)
                    }
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs border transition-colors",
                      filterType.includes(opt.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <button
                onClick={() => setFilterRegistered(!filterRegistered)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-colors",
                  filterRegistered
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                Mes inscriptions uniquement
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg capitalize">{getTitle()}</CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToday}>
                Aujourd&apos;hui
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* === MONTH VIEW === */}
          {viewMode === "month" && (
            <>
              <div className="grid grid-cols-7 mb-2">
                {weekDayLabels.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {monthDays.map((day) => {
                  const daySessions = getSessionsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "min-h-[80px] md:min-h-[100px] p-1.5 bg-card cursor-pointer hover:bg-accent/30 transition-colors",
                        !isCurrentMonth && "opacity-40"
                      )}
                      onClick={() => {
                        setCurrentDate(day);
                        if (daySessions.length > 0) setViewMode("day");
                      }}
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
                          <SessionPill key={s.id} session={s} compact />
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
            </>
          )}

          {/* === WEEK VIEW === */}
          {viewMode === "week" && (
            <>
              {/* Week day headers */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] mb-1">
                <div />
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "text-center py-2 cursor-pointer hover:bg-accent/30 rounded transition-colors",
                      isToday(day) && "bg-primary/10"
                    )}
                    onClick={() => {
                      setCurrentDate(day);
                      setViewMode("day");
                    }}
                  >
                    <p className="text-xs text-muted-foreground">
                      {format(day, "EEE", { locale: fr })}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-medium w-7 h-7 mx-auto flex items-center justify-center rounded-full",
                        isToday(day) && "bg-primary text-primary-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] relative border-t border-border max-h-[600px] overflow-y-auto">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="contents"
                  >
                    <div className="h-[60px] pr-2 text-right text-[10px] text-muted-foreground -translate-y-2 flex-shrink-0">
                      {hour}:00
                    </div>
                    {weekDays.map((day) => {
                      const daySessions = getSessionsForDay(day).filter(
                        (s) => {
                          const h = getHours(new Date(s.start_time));
                          return h === hour;
                        }
                      );
                      return (
                        <div
                          key={`${day.toISOString()}-${hour}`}
                          className="h-[60px] border-t border-l border-border/50 relative"
                        >
                          {daySessions.map((s) => {
                            const start = new Date(s.start_time);
                            const end = new Date(s.end_time);
                            const topMin = getMinutes(start);
                            const duration = Math.max(
                              differenceInMinutes(end, start),
                              25
                            );
                            return (
                              <button
                                key={s.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSession(s);
                                }}
                                className="absolute left-0.5 right-0.5 rounded px-1 text-[10px] font-medium truncate overflow-hidden z-10 hover:opacity-80 transition-opacity"
                                style={{
                                  top: `${topMin}px`,
                                  height: `${duration}px`,
                                  backgroundColor:
                                    (s.color || "#C6FF00") + "30",
                                  color: s.color || "#C6FF00",
                                  borderLeft: `2px solid ${s.color || "#C6FF00"}`,
                                }}
                              >
                                {formatTime(s.start_time)} {s.title}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* === DAY VIEW === */}
          {viewMode === "day" && (
            <div className="grid grid-cols-[60px_1fr] relative border-t border-border max-h-[600px] overflow-y-auto">
              {hours.map((hour) => {
                const hourSessions = getSessionsForDay(currentDate).filter(
                  (s) => getHours(new Date(s.start_time)) === hour
                );
                return (
                  <div key={hour} className="contents">
                    <div className="h-[60px] pr-2 text-right text-xs text-muted-foreground -translate-y-2">
                      {hour}:00
                    </div>
                    <div className="h-[60px] border-t border-border/50 relative">
                      {hourSessions.map((s) => {
                        const start = new Date(s.start_time);
                        const end = new Date(s.end_time);
                        const topMin = getMinutes(start);
                        const duration = Math.max(
                          differenceInMinutes(end, start),
                          30
                        );
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSession(s)}
                            className="absolute left-1 right-1 rounded-lg px-3 py-1.5 text-left overflow-hidden z-10 hover:opacity-80 transition-opacity"
                            style={{
                              top: `${topMin}px`,
                              height: `${duration}px`,
                              backgroundColor:
                                (s.color || "#C6FF00") + "20",
                              borderLeft: `3px solid ${s.color || "#C6FF00"}`,
                            }}
                          >
                            <p
                              className="text-xs font-medium truncate"
                              style={{ color: s.color || "#C6FF00" }}
                            >
                              {s.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatTime(s.start_time)} —{" "}
                              {formatTime(s.end_time)}
                              {s.location && ` • ${s.location}`}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Users className="h-2.5 w-2.5" />
                                {s.participants_count}
                                {s.max_participants &&
                                  `/${s.max_participants}`}
                              </span>
                              {s.is_registered && (
                                <Badge
                                  variant="outline"
                                  className="h-4 text-[9px] bg-neon/20 text-neon border-neon/30"
                                >
                                  Inscrit
                                </Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prochaines sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredSessions
            .filter(
              (s) =>
                new Date(s.start_time) >= new Date() &&
                s.status === "scheduled"
            )
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
                      {session.max_participants &&
                        `/${session.max_participants}`}
                    </span>
                  </div>
                </div>
                {session.is_registered && (
                  <Badge
                    variant="outline"
                    className="bg-neon/20 text-neon text-[10px]"
                  >
                    Inscrit
                  </Badge>
                )}
              </button>
            ))}
          {filteredSessions.filter(
            (s) =>
              new Date(s.start_time) >= new Date() && s.status === "scheduled"
          ).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune session a venir
            </p>
          )}
        </CardContent>
      </Card>

      {/* Session detail dialog */}
      <Dialog
        open={!!selectedSession}
        onOpenChange={() => setSelectedSession(null)}
      >
        <DialogContent>
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSession.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedSession.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedSession.description}
                  </p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatDateTime(selectedSession.start_time)} —{" "}
                      {formatTime(selectedSession.end_time)}
                    </span>
                  </div>
                  {selectedSession.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedSession.location.startsWith("http") ? (
                          <a
                            href={selectedSession.location}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Rejoindre en ligne
                          </a>
                        ) : (
                          selectedSession.location
                        )}
                      </span>
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
                      <span>
                        Anime par{" "}
                        {(selectedSession.host as any).full_name}
                      </span>
                    </div>
                  )}
                </div>
                {selectedSession.status === "cancelled" ? (
                  <Badge variant="destructive">Session annulee</Badge>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant={
                        selectedSession.is_registered ? "outline" : "default"
                      }
                      disabled={registering}
                      onClick={() => handleRegister(selectedSession)}
                    >
                      {selectedSession.is_registered
                        ? "Se desinscrire"
                        : "S'inscrire"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      title="Ajouter au calendrier"
                    >
                      <a
                        href={`/api/calendar/${selectedSession.id}`}
                        download
                      >
                        <CalendarPlus className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
