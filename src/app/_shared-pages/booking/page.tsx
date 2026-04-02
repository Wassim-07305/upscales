"use client";

import { useState, useMemo, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  staggerContainer,
  fadeInUp,
  defaultTransition,
} from "@/lib/animations";
import {
  useBookingPages,
  useCreateBookingPage,
  useDeleteBookingPage,
  useUpdateBookingPage,
  useBookingAvailability,
  useUpsertAvailability,
  useBookingExceptions,
  useAddBookingException,
  useRemoveBookingException,
  useBookings,
  useBookingKPIs,
  type BookingPage,
  type BookingAvailability,
  type QualificationField,
  type Booking,
} from "@/hooks/use-booking-pages";
import {
  CALL_RESULT_LABELS,
  CALL_RESULT_COLORS,
  CALL_RESULTS,
  type CallResultType,
} from "@/lib/constants";
import { CallResultModal } from "@/components/booking/CallResultModal";
import { cn } from "@/lib/utils";
import {
  Eye,
  Users,
  CalendarCheck,
  TrendingUp,
  Plus,
  Copy,
  ExternalLink,
  Trash2,
  Settings,
  X,
  Check,
  Clock,
  Ban,
  Phone,
  Mail,
  User,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  CalendarX,
  Calendar,
  List,
  ClipboardCheck,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

const DAY_LABELS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

const PERIOD_OPTIONS = [
  { value: "7d" as const, label: "7 jours" },
  { value: "30d" as const, label: "30 jours" },
  { value: "90d" as const, label: "90 jours" },
  { value: "all" as const, label: "Tout" },
];

type Period = "7d" | "30d" | "90d" | "all";

type MainTab = "pages" | "reservations";

export default function BookingAdminPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [mainTab, setMainTab] = useState<MainTab>("pages");
  const [selectedPage, setSelectedPage] = useState<BookingPage | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [bookingsView, setBookingsView] = useState<"list" | "calendar">("list");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalDay, setSelectedCalDay] = useState<string | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(
    null,
  );
  const [resultBooking, setResultBooking] = useState<Booking | null>(null);

  const { data: pages, isLoading: pagesLoading } = useBookingPages();
  const { data: kpis, isLoading: kpisLoading } = useBookingKPIs(
    undefined,
    period,
  );
  const { data: allBookings, isLoading: bookingsLoading } = useBookings({
    limit: 200,
  });

  // fieldLabelMap pour les réponses de qualification
  const fieldLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const page of pages ?? []) {
      for (const field of page.qualification_fields ?? []) {
        if (field.id && field.label) map.set(field.id, field.label);
      }
    }
    return map;
  }, [pages]);

  // Réservations filtrées par période
  const filteredBookings = useMemo(() => {
    if (!allBookings) return [];
    if (period === "all") return allBookings;
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = subDays(new Date(), days);
    return allBookings.filter((b) => new Date(b.date + "T00:00:00") >= cutoff);
  }, [allBookings, period]);

  // Données graphique
  const chartData = useMemo(() => {
    if (!allBookings) return [];
    const now = new Date();
    if (period === "7d" || period === "30d") {
      const days = period === "7d" ? 7 : 30;
      return Array.from({ length: days }, (_, i) => {
        const d = subDays(now, days - 1 - i);
        const dateStr = format(d, "yyyy-MM-dd");
        return {
          label: format(d, "d MMM", { locale: fr }),
          bookings: allBookings.filter((b) => b.date === dateStr).length,
        };
      });
    }
    if (period === "90d") {
      const weeks: Record<string, number> = {};
      for (let i = 89; i >= 0; i--) {
        const d = subDays(now, i);
        const key = format(startOfWeek(d, { weekStartsOn: 1 }), "dd/MM");
        weeks[key] = 0;
      }
      for (const b of allBookings) {
        const d = new Date(b.date + "T00:00:00");
        if (d >= subDays(now, 89)) {
          const key = format(startOfWeek(d, { weekStartsOn: 1 }), "dd/MM");
          if (key in weeks) weeks[key]++;
        }
      }
      return Object.entries(weeks).map(([label, bookings]) => ({
        label,
        bookings,
      }));
    }
    // all → par mois
    const months: Record<string, number> = {};
    for (const b of allBookings) {
      const key = format(new Date(b.date + "T00:00:00"), "MMM yy", {
        locale: fr,
      });
      months[key] = (months[key] ?? 0) + 1;
    }
    return Object.entries(months).map(([label, bookings]) => ({
      label,
      bookings,
    }));
  }, [allBookings, period]);

  return (
    <motion.div variants={staggerContainer} className="space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        transition={defaultTransition}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Booking
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-1.5 leading-relaxed">
            Gerez vos pages de reservation et suivez les rendez-vous
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface border border-border rounded-lg p-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  period === opt.value
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {mainTab === "pages" && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle page
            </button>
          )}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={fadeInUp}
        transition={defaultTransition}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <KPICard
          icon={Eye}
          label="Vues"
          value={kpisLoading ? "..." : String(kpis?.views ?? 0)}
          color="blue"
        />
        <KPICard
          icon={Users}
          label="Contacts"
          value={kpisLoading ? "..." : String(kpis?.contacts ?? 0)}
          color="purple"
        />
        <KPICard
          icon={CalendarCheck}
          label="Rendez-vous"
          value={kpisLoading ? "..." : String(kpis?.bookings ?? 0)}
          color="emerald"
        />
        <KPICard
          icon={TrendingUp}
          label="Taux conversion"
          value={kpisLoading ? "..." : `${kpis?.conversionRate ?? 0}%`}
          color="amber"
        />
      </motion.div>

      {/* Chart */}
      <motion.div
        variants={fadeInUp}
        transition={defaultTransition}
        className="bg-surface border border-border rounded-xl p-6"
      >
        <h2 className="text-sm font-bold text-foreground tracking-tight mb-4">
          Réservations créées
        </h2>
        {chartData.length === 0 || chartData.every((d) => d.bookings === 0) ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
            <BarChart3 className="w-8 h-8 mb-2" />
            <p className="text-sm">Aucune réservation sur cette période</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [v, "Réservations"]}
                contentStyle={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                }}
              />
              <Bar
                dataKey="bookings"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInUp} transition={defaultTransition}>
        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-4">
          {(["pages", "reservations"] as MainTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setMainTab(t)}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                mainTab === t
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "pages"
                ? "Pages de booking"
                : `Réservations${filteredBookings ? ` (${filteredBookings.length})` : ""}`}
            </button>
          ))}
        </div>

        {/* Tab: Pages */}
        {mainTab === "pages" && (
          <div className="bg-surface border border-border rounded-xl p-6">
            {pagesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-muted animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : !pages || pages.length === 0 ? (
              <div className="text-center py-12">
                <CalendarCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aucune page de booking
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  Créer votre première page
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {pages.map((page) => (
                  <BookingPageRow
                    key={page.id}
                    page={page}
                    onSelect={() => setSelectedPage(page)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Réservations */}
        {mainTab === "reservations" && (
          <div className="bg-surface border border-border rounded-xl p-6">
            {/* Vue toggle */}
            <div className="flex items-center justify-end mb-4">
              <div className="flex items-center bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setBookingsView("list")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    bookingsView === "list"
                      ? "bg-surface shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <List className="w-3.5 h-3.5" /> Liste
                </button>
                <button
                  onClick={() => setBookingsView("calendar")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    bookingsView === "calendar"
                      ? "bg-surface shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Calendar className="w-3.5 h-3.5" /> Calendrier
                </button>
              </div>
            </div>

            {bookingsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-muted animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : bookingsView === "calendar" ? (
              <BookingsCalendarView
                bookings={filteredBookings}
                calendarDate={calendarDate}
                setCalendarDate={setCalendarDate}
                selectedDay={selectedCalDay}
                setSelectedDay={setSelectedCalDay}
              />
            ) : filteredBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Aucune réservation sur cette période
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Prospect
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Page
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        RDV
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Résultat
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Qualification
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredBookings.map((booking) => (
                      <Fragment key={booking.id}>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-foreground">
                              {booking.prospect_name}
                            </p>
                            {booking.prospect_email && (
                              <p className="text-xs text-muted-foreground">
                                {booking.prospect_email}
                              </p>
                            )}
                            {booking.prospect_phone && (
                              <p className="text-xs text-muted-foreground">
                                {booking.prospect_phone}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground/80">
                            {booking.booking_page?.title ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-foreground">
                              {format(
                                new Date(booking.date + "T00:00:00"),
                                "dd MMM yyyy",
                                { locale: fr },
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.start_time.slice(0, 5)} —{" "}
                              {booking.end_time.slice(0, 5)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <BookingStatusBadge status={booking.status} />
                          </td>
                          <td className="px-4 py-3">
                            {booking.call_result ? (
                              <button
                                onClick={() => setResultBooking(booking)}
                                className={cn(
                                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border",
                                  CALL_RESULT_COLORS[
                                    booking.call_result as CallResultType
                                  ],
                                )}
                              >
                                {CALL_RESULT_LABELS[
                                  booking.call_result as CallResultType
                                ] ?? booking.call_result}
                              </button>
                            ) : (
                              <button
                                onClick={() => setResultBooking(booking)}
                                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                              >
                                <ClipboardCheck className="w-3 h-3" />
                                Saisir résultat
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {booking.qualification_answers &&
                            Object.keys(booking.qualification_answers).length >
                              0 ? (
                              <button
                                onClick={() =>
                                  setExpandedBookingId(
                                    expandedBookingId === booking.id
                                      ? null
                                      : booking.id,
                                  )
                                }
                                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                              >
                                {
                                  Object.keys(booking.qualification_answers)
                                    .length
                                }{" "}
                                rép.
                                {expandedBookingId === booking.id ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                        {expandedBookingId === booking.id &&
                          booking.qualification_answers && (
                            <tr className="bg-muted/20">
                              <td colSpan={6} className="px-4 py-3">
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {Object.entries(
                                    booking.qualification_answers,
                                  ).map(([key, value]) => (
                                    <div
                                      key={key}
                                      className="rounded-lg bg-surface p-3 border border-border/60"
                                    >
                                      <p className="text-xs font-medium text-muted-foreground">
                                        {fieldLabelMap.get(key) ?? key}
                                      </p>
                                      <p className="mt-0.5 text-sm text-foreground">
                                        {Array.isArray(value)
                                          ? value.join(", ")
                                          : value || "—"}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Modal création page */}
      <AnimatePresence>
        {showCreateForm && (
          <CreateBookingPageModal onClose={() => setShowCreateForm(false)} />
        )}
      </AnimatePresence>

      {/* Panel détail page */}
      <AnimatePresence>
        {selectedPage && (
          <BookingPageDetailPanel
            page={selectedPage}
            onClose={() => setSelectedPage(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal résultat appel */}
      {resultBooking && (
        <CallResultModal
          open={!!resultBooking}
          onClose={() => setResultBooking(null)}
          bookingId={resultBooking.id}
          prospectName={resultBooking.prospect_name}
          currentResult={resultBooking.call_result}
          currentObjections={resultBooking.objections}
          currentNotes={resultBooking.follow_up_notes}
          currentFollowUpDate={resultBooking.follow_up_date}
        />
      )}
    </motion.div>
  );
}

// ─── Bookings Calendar View ─────────────────────────────────

const CAL_DAY_HEADERS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

function BookingsCalendarView({
  bookings,
  calendarDate,
  setCalendarDate,
  selectedDay,
  setSelectedDay,
}: {
  bookings: Booking[];
  calendarDate: Date;
  setCalendarDate: (d: Date) => void;
  selectedDay: string | null;
  setSelectedDay: (d: string | null) => void;
}) {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const bookingsByDay = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of bookings) {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    }
    return map;
  }, [bookings]);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  // Monday-first: (getDay() + 6) % 7 → 0=Mon, 6=Sun
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDays = lastDayOfMonth.getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const selectedDayBookings = selectedDay
    ? (bookingsByDay[selectedDay] ?? [])
    : [];

  return (
    <div className="space-y-4">
      {/* Nav mois */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setCalendarDate(new Date(year, month - 1, 1));
            setSelectedDay(null);
          }}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-foreground capitalize">
          {format(calendarDate, "MMMM yyyy", { locale: fr })}
        </span>
        <button
          onClick={() => {
            setCalendarDate(new Date(year, month + 1, 1));
            setSelectedDay(null);
          }}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 gap-px">
        {CAL_DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = bookingsByDay[dateStr]?.length ?? 0;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDay;
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 rounded-lg text-xs font-medium transition-all",
                isSelected
                  ? "bg-primary text-white"
                  : isToday
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-foreground",
              )}
            >
              {day}
              {count > 0 && (
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full mt-0.5",
                    isSelected ? "bg-white" : "bg-primary",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Reservations du jour selectionne */}
      {selectedDay && (
        <div className="border-t border-border pt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {format(new Date(selectedDay + "T00:00:00"), "EEEE d MMMM", {
              locale: fr,
            })}
            {" — "}
            {selectedDayBookings.length} réservation
            {selectedDayBookings.length > 1 ? "s" : ""}
          </p>
          {selectedDayBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune réservation ce jour
            </p>
          ) : (
            selectedDayBookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {b.prospect_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.start_time} - {b.end_time}
                    </p>
                  </div>
                </div>
                <BookingStatusBadge status={b.status} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────

function KPICard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: "blue" | "purple" | "emerald" | "amber";
}) {
  const colorMap = {
    blue: "bg-blue-500/10 ring-blue-500/20 text-blue-500",
    purple: "bg-purple-500/10 ring-purple-500/20 text-purple-500",
    emerald: "bg-emerald-500/10 ring-emerald-500/20 text-emerald-500",
    amber: "bg-amber-500/10 ring-amber-500/20 text-amber-500",
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center ring-1",
            colorMap[color],
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">
        {value}
      </p>
      <p className="text-xs text-muted-foreground/80 mt-1">{label}</p>
    </div>
  );
}

// ─── Booking Page Row ───────────────────────────────────────

function BookingPageRow({
  page,
  onSelect,
}: {
  page: BookingPage;
  onSelect: () => void;
}) {
  const deleteMutation = useDeleteBookingPage();
  const updateMutation = useUpdateBookingPage();

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/book/${page.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Lien copie dans le presse-papier");
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: page.brand_color }}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {page.title}
          </p>
          <p className="text-xs text-muted-foreground">
            /{page.slug} &middot; {page.slot_duration} min
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Toggle actif */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateMutation.mutate({
              id: page.id,
              is_active: !page.is_active,
            });
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title={page.is_active ? "Desactiver" : "Activer"}
        >
          {page.is_active ? (
            <ToggleRight className="w-5 h-5 text-emerald-500" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
        </button>

        {/* Copier lien */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            copyLink();
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Copier le lien"
        >
          <Copy className="w-4 h-4" />
        </button>

        {/* Ouvrir */}
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Ouvrir"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* Supprimer */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Supprimer cette page de booking ?")) {
              deleteMutation.mutate(page.id);
            }
          }}
          className="text-muted-foreground hover:text-lime-400 transition-colors opacity-0 group-hover:opacity-100"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Detail */}
        <button
          onClick={onSelect}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Booking Status Badge ───────────────────────────────────

function BookingStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    confirmed: {
      label: "Confirme",
      className: "bg-emerald-500/10 text-emerald-600",
    },
    pending: {
      label: "En attente",
      className: "bg-amber-500/10 text-amber-600",
    },
    cancelled: {
      label: "Annule",
      className: "bg-lime-400/10 text-lime-400",
    },
    completed: {
      label: "Termine",
      className: "bg-blue-500/10 text-blue-600",
    },
  };
  const c = config[status] ?? config.confirmed;
  return (
    <span
      className={cn(
        "text-[11px] font-medium px-2 py-0.5 rounded-full ml-3 shrink-0",
        c.className,
      )}
    >
      {c.label}
    </span>
  );
}

// ─── Create Booking Page Modal ──────────────────────────────

function CreateBookingPageModal({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateBookingPage();
  const [title, setTitle] = useState("Prendre rendez-vous");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [slotDuration, setSlotDuration] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [minNoticeHours, setMinNoticeHours] = useState(24);
  const [maxDaysAhead, setMaxDaysAhead] = useState(30);
  const [brandColor, setBrandColor] = useState("#c6ff00");

  const handleCreate = () => {
    if (!slug.trim()) {
      toast.error("Le slug est obligatoire");
      return;
    }
    createMutation.mutate(
      {
        title,
        slug: slug
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-"),
        description: description || null,
        slot_duration: slotDuration,
        buffer_minutes: bufferMinutes,
        min_notice_hours: minNoticeHours,
        max_days_ahead: maxDaysAhead,
        brand_color: brandColor,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            Nouvelle page de booking
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Titre
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Prendre rendez-vous"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Slug (URL)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">/book/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  )
                }
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="appel-decouverte"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Decouvrez comment atteindre 10K/mois..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Duree (min)
              </label>
              <input
                type="number"
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                min={15}
                step={15}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Buffer (min)
              </label>
              <input
                type="number"
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(Number(e.target.value))}
                min={0}
                step={5}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Preavis minimum (h)
              </label>
              <input
                type="number"
                value={minNoticeHours}
                onChange={(e) => setMinNoticeHours(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Jours a l&apos;avance (max)
              </label>
              <input
                type="number"
                value={maxDaysAhead}
                onChange={(e) => setMaxDaysAhead(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Couleur de marque
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">
                {brandColor}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending || !slug.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? "Creation..." : "Creer"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Booking Page Detail Panel ──────────────────────────────

function BookingPageDetailPanel({
  page,
  onClose,
}: {
  page: BookingPage;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "settings" | "availability" | "exceptions" | "qualification"
  >("settings");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-surface border-l border-border w-full max-w-xl h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface z-10">
          <div>
            <h2 className="text-lg font-bold text-foreground">{page.title}</h2>
            <p className="text-xs text-muted-foreground">/{page.slug}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(
            [
              { key: "settings", label: "Paramètres", icon: Settings },
              { key: "availability", label: "Disponibilites", icon: Clock },
              { key: "exceptions", label: "Exceptions", icon: CalendarX },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors border-b-2",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "settings" && <PageSettingsTab page={page} />}
          {activeTab === "availability" && <AvailabilityTab pageId={page.id} />}
          {activeTab === "exceptions" && <ExceptionsTab pageId={page.id} />}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Settings Tab ───────────────────────────────────────────

function PageSettingsTab({ page }: { page: BookingPage }) {
  const updateMutation = useUpdateBookingPage();
  const [title, setTitle] = useState(page.title);
  const [description, setDescription] = useState(page.description ?? "");
  const [slotDuration, setSlotDuration] = useState(page.slot_duration);
  const [bufferMinutes, setBufferMinutes] = useState(page.buffer_minutes);
  const [minNoticeHours, setMinNoticeHours] = useState(page.min_notice_hours);
  const [maxDaysAhead, setMaxDaysAhead] = useState(page.max_days_ahead);
  const [brandColor, setBrandColor] = useState(page.brand_color);
  const [qualificationFields, setQualificationFields] = useState<
    QualificationField[]
  >(page.qualification_fields ?? []);

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/book/${page.slug}`;

  const handleSave = () => {
    updateMutation.mutate({
      id: page.id,
      title,
      description: description || null,
      slot_duration: slotDuration,
      buffer_minutes: bufferMinutes,
      min_notice_hours: minNoticeHours,
      max_days_ahead: maxDaysAhead,
      brand_color: brandColor,
      qualification_fields: qualificationFields,
    });
  };

  const addField = () => {
    setQualificationFields([
      ...qualificationFields,
      {
        id: crypto.randomUUID(),
        label: "",
        type: "text",
        required: false,
      },
    ]);
  };

  const removeField = (id: string) => {
    setQualificationFields(qualificationFields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<QualificationField>) => {
    setQualificationFields(
      qualificationFields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  return (
    <div className="space-y-5">
      {/* Lien public */}
      <div className="p-4 bg-muted/30 rounded-xl border border-border">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Lien public
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs text-foreground bg-background px-3 py-2 rounded-lg border border-border truncate">
            {publicUrl}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
              toast.success("Lien copie");
            }}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Titre
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Duree (min)
          </label>
          <input
            type="number"
            value={slotDuration}
            onChange={(e) => setSlotDuration(Number(e.target.value))}
            min={15}
            step={15}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Buffer (min)
          </label>
          <input
            type="number"
            value={bufferMinutes}
            onChange={(e) => setBufferMinutes(Number(e.target.value))}
            min={0}
            step={5}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Preavis minimum (h)
          </label>
          <input
            type="number"
            value={minNoticeHours}
            onChange={(e) => setMinNoticeHours(Number(e.target.value))}
            min={1}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Jours max a l&apos;avance
          </label>
          <input
            type="number"
            value={maxDaysAhead}
            onChange={(e) => setMaxDaysAhead(Number(e.target.value))}
            min={1}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Couleur
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer"
          />
          <span className="text-xs text-muted-foreground">{brandColor}</span>
        </div>
      </div>

      {/* Champs de qualification */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-foreground">
            Champs de qualification
          </label>
          <button
            onClick={addField}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Ajouter
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Nom, email et telephone sont toujours inclus. Ajoutez des champs
          personnalises ici.
        </p>

        {qualificationFields.length > 0 && (
          <div className="space-y-3">
            {qualificationFields.map((field) => (
              <div
                key={field.id}
                className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border"
              >
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) =>
                      updateField(field.id, { label: e.target.value })
                    }
                    placeholder="Libelle du champ"
                    className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateField(field.id, {
                          type: e.target.value as QualificationField["type"],
                        })
                      }
                      className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground"
                    >
                      <option value="text">Texte</option>
                      <option value="textarea">Texte long</option>
                      <option value="select">Liste</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          updateField(field.id, {
                            required: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      Obligatoire
                    </label>
                  </div>
                  {field.type === "select" && (
                    <input
                      type="text"
                      value={field.options?.join(", ") ?? ""}
                      onChange={(e) =>
                        updateField(field.id, {
                          options: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Options separees par des virgules"
                      className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  )}
                </div>
                <button
                  onClick={() => removeField(field.id)}
                  className="text-muted-foreground hover:text-lime-400 mt-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="w-full px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </div>
  );
}

// ─── Availability Tab ───────────────────────────────────────

function AvailabilityTab({ pageId }: { pageId: string }) {
  const { data: availability, isLoading } = useBookingAvailability(pageId);
  const upsertMutation = useUpsertAvailability();

  // Etat local pour editer
  const [slots, setSlots] = useState<
    {
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_active: boolean;
    }[]
  >([]);
  const [initialized, setInitialized] = useState(false);

  // Init from data
  if (availability && !initialized) {
    if (availability.length > 0) {
      setSlots(
        availability.map((a) => ({
          day_of_week: a.day_of_week,
          start_time: a.start_time,
          end_time: a.end_time,
          is_active: a.is_active,
        })),
      );
    } else {
      // Defaults: lundi-vendredi 9h-18h
      setSlots(
        [1, 2, 3, 4, 5].map((d) => ({
          day_of_week: d,
          start_time: "09:00",
          end_time: "18:00",
          is_active: true,
        })),
      );
    }
    setInitialized(true);
  }

  const toggleDay = (day: number) => {
    const existing = slots.find((s) => s.day_of_week === day);
    if (existing) {
      setSlots(
        slots.map((s) =>
          s.day_of_week === day ? { ...s, is_active: !s.is_active } : s,
        ),
      );
    } else {
      setSlots([
        ...slots,
        {
          day_of_week: day,
          start_time: "09:00",
          end_time: "18:00",
          is_active: true,
        },
      ]);
    }
  };

  const updateSlotTime = (
    day: number,
    field: "start_time" | "end_time",
    value: string,
  ) => {
    setSlots(
      slots.map((s) => (s.day_of_week === day ? { ...s, [field]: value } : s)),
    );
  };

  const handleSave = () => {
    upsertMutation.mutate(
      slots
        .filter((s) => s.is_active)
        .map((s) => ({
          booking_page_id: pageId,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          is_active: true,
        })),
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Definissez les plages horaires disponibles pour chaque jour de la
        semaine.
      </p>

      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 0].map((day) => {
          const slot = slots.find((s) => s.day_of_week === day);
          const isActive = slot?.is_active ?? false;

          return (
            <div
              key={day}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                isActive
                  ? "border-border bg-muted/20"
                  : "border-border/50 bg-muted/5 opacity-50",
              )}
            >
              <button onClick={() => toggleDay(day)} className="shrink-0">
                {isActive ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Ban className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              <span className="text-sm font-medium text-foreground w-24 shrink-0">
                {DAY_LABELS[day]}
              </span>

              {isActive && slot && (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={(e) =>
                      updateSlotTime(day, "start_time", e.target.value)
                    }
                    className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground"
                  />
                  <span className="text-xs text-muted-foreground">a</span>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={(e) =>
                      updateSlotTime(day, "end_time", e.target.value)
                    }
                    className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground"
                  />
                </div>
              )}

              {!isActive && (
                <span className="text-xs text-muted-foreground">
                  Indisponible
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={upsertMutation.isPending}
        className="w-full px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {upsertMutation.isPending
          ? "Enregistrement..."
          : "Enregistrer les disponibilites"}
      </button>
    </div>
  );
}

// ─── Exceptions Tab ─────────────────────────────────────────

function ExceptionsTab({ pageId }: { pageId: string }) {
  const { data: exceptions, isLoading } = useBookingExceptions(pageId);
  const addMutation = useAddBookingException();
  const removeMutation = useRemoveBookingException();
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");

  const handleAdd = () => {
    if (!newDate) {
      toast.error("Sélectionnez une date");
      return;
    }
    addMutation.mutate(
      {
        booking_page_id: pageId,
        exception_date: newDate,
        reason: newReason || undefined,
      },
      {
        onSuccess: () => {
          setNewDate("");
          setNewReason("");
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Bloquez des jours specifiques ou vous ne serez pas disponible.
      </p>

      {/* Add new */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-xs font-medium text-foreground mb-1 block">
            Date
          </label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-foreground mb-1 block">
            Raison
          </label>
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Vacances, formation..."
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={addMutation.isPending}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
        >
          Ajouter
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : !exceptions || exceptions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Aucune exception configuree
        </p>
      ) : (
        <div className="space-y-2">
          {exceptions.map((exc) => (
            <div
              key={exc.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(exc.exception_date), "EEEE d MMMM yyyy", {
                    locale: fr,
                  })}
                </p>
                {exc.reason && (
                  <p className="text-xs text-muted-foreground">{exc.reason}</p>
                )}
              </div>
              <button
                onClick={() => removeMutation.mutate(exc.id)}
                className="text-muted-foreground hover:text-lime-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
