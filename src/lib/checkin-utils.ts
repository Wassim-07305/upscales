import type { WeeklyCheckin } from "@/types/coaching";

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toWeekStart(date: Date): string {
  const d = getMonday(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Calcule le streak de check-ins consécutifs depuis la semaine courante */
export function computeStreak(checkins: WeeklyCheckin[]): number {
  if (checkins.length === 0) return 0;
  const sorted = [...checkins].sort((a, b) =>
    b.week_start.localeCompare(a.week_start),
  );
  const now = new Date();
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    const expectedDate = new Date(now);
    expectedDate.setDate(expectedDate.getDate() - i * 7);
    const expected = toWeekStart(expectedDate);
    if (sorted[i].week_start === expected) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
