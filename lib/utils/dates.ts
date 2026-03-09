import { formatDistanceToNow, format, isToday, isYesterday, isSameWeek } from "date-fns";
import { fr } from "date-fns/locale";

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy", { locale: fr });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy à HH:mm", { locale: fr });
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), "HH:mm", { locale: fr });
}

export function formatMessageDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return `Aujourd'hui à ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Hier à ${format(d, "HH:mm")}`;
  if (isSameWeek(d, new Date())) return format(d, "EEEE à HH:mm", { locale: fr });
  return format(d, "d MMM à HH:mm", { locale: fr });
}

export function formatCalendarDate(date: string | Date): string {
  return format(new Date(date), "EEEE d MMMM yyyy", { locale: fr });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
