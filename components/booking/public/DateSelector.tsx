"use client";

import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isBefore,
  isAfter,
  isToday,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DateSelectorProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  maxDaysAhead: number;
  brandColor: string;
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function DateSelector({
  selectedDate,
  onSelectDate,
  maxDaysAhead,
  brandColor,
}: DateSelectorProps) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today);

  const maxDate = useMemo(
    () => addDays(today, maxDaysAhead),
    [today, maxDaysAhead]
  );

  // Limites de navigation mois
  const canGoPrev = isSameMonth(currentMonth, today)
    ? false
    : isAfter(startOfMonth(currentMonth), today);
  const canGoNext = isBefore(
    startOfMonth(addMonths(currentMonth, 1)),
    maxDate
  );

  // Calcul des jours a afficher (6 semaines max, lundi = debut)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const handlePrev = () => {
    if (canGoPrev || isSameMonth(currentMonth, today)) {
      const prev = subMonths(currentMonth, 1);
      // Ne pas aller avant le mois courant
      if (
        isSameMonth(prev, today) ||
        isAfter(startOfMonth(prev), startOfMonth(today))
      ) {
        setCurrentMonth(prev);
      }
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  const isDateDisabled = (date: Date): boolean => {
    // Passe : on desactive la veille et avant
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    if (isBefore(date, todayStart)) return true;
    // Au-dela du max
    if (isAfter(date, maxDate)) return true;
    return false;
  };

  return (
    <Card className="gradient-border bg-[#141414]">
      <CardHeader>
        <CardTitle className="text-lg">Choisissez une date</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Navigation mois */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrev}
            disabled={isSameMonth(currentMonth, today)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isSameMonth(currentMonth, today)
                ? "text-muted-foreground/30 cursor-not-allowed"
                : "text-muted-foreground hover:text-foreground hover:bg-[#1C1C1C]"
            )}
            aria-label="Mois precedent"
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="text-sm font-semibold text-foreground capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </span>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              !canGoNext
                ? "text-muted-foreground/30 cursor-not-allowed"
                : "text-muted-foreground hover:text-foreground hover:bg-[#1C1C1C]"
            )}
            aria-label="Mois suivant"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grille de jours */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const disabled = isDateDisabled(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const todayIndicator = isToday(day);

            return (
              <button
                key={idx}
                type="button"
                disabled={disabled || !isCurrentMonth}
                onClick={() => onSelectDate(day)}
                className={cn(
                  "relative flex items-center justify-center h-10 text-sm rounded-lg transition-all duration-200",
                  !isCurrentMonth && "invisible",
                  isCurrentMonth &&
                    !disabled &&
                    !isSelected &&
                    "text-foreground hover:bg-[#1C1C1C]",
                  disabled &&
                    isCurrentMonth &&
                    "text-muted-foreground/30 cursor-not-allowed"
                )}
                style={
                  isSelected
                    ? {
                        backgroundColor: brandColor,
                        color: "#0D0D0D",
                        fontWeight: 600,
                        boxShadow: `0 0 16px ${brandColor}30`,
                      }
                    : undefined
                }
              >
                {day.getDate()}
                {/* Indicateur "aujourd'hui" */}
                {todayIndicator && !isSelected && (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full"
                    style={{ backgroundColor: brandColor }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
