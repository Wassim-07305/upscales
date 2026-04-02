"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const CalendarContent = dynamic(
  () => import("@/app/_shared-pages/calendar/page"),
  { ssr: false },
);
const BookingContent = dynamic(() => import("@/app/client/booking/page"), {
  ssr: false,
});
const CallsContent = dynamic(() => import("@/app/_shared-pages/calls/page"), {
  ssr: false,
});

type CalendarTab = "appels" | "reserver" | "calendrier";

const TABS: { key: CalendarTab; label: string }[] = [
  { key: "appels", label: "Appels & Lives" },
  { key: "reserver", label: "Reserver" },
  { key: "calendrier", label: "Calendrier" },
];

export default function ClientCalendarPage() {
  const [tab, setTab] = useState<CalendarTab>("appels");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-heading)] font-bold text-foreground tracking-tight">
          Calendrier
        </h1>
        <p className="text-sm text-muted-foreground/80 mt-1.5 leading-relaxed">
          Evenements, reservations et appels
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "h-10 px-4 text-sm font-medium transition-all relative whitespace-nowrap",
              tab === t.key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "appels" && <CallsContent hideHeader />}
      {tab === "reserver" && <BookingContent hideHeader />}
      {tab === "calendrier" && <CalendarContent hideHeader />}
    </div>
  );
}
