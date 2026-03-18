import type { GoogleEvent } from "./types";

export interface BookingData {
  prospect_name: string;
  prospect_email: string;
  prospect_phone?: string | null;
  date: string;       // "YYYY-MM-DD"
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
}

function toDateTimeISO(date: string, time: string, timezone = "Europe/Paris"): string {
  // Combine "YYYY-MM-DD" + "HH:MM" into a dateTime with timezone
  return `${date}T${time}:00`;
}

export async function pushBookingToGCal(
  accessToken: string,
  calendarId: string,
  booking: BookingData
): Promise<GoogleEvent> {
  const timezone = "Europe/Paris";
  const event = {
    summary: `RDV - ${booking.prospect_name}`,
    description: [
      `Email : ${booking.prospect_email}`,
      booking.prospect_phone ? `Tél : ${booking.prospect_phone}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    start: {
      dateTime: toDateTimeISO(booking.date, booking.start_time),
      timeZone: timezone,
    },
    end: {
      dateTime: toDateTimeISO(booking.date, booking.end_time),
      timeZone: timezone,
    },
  };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );
  return res.json();
}

export async function fetchEvents(
  accessToken: string,
  calendarId: string
): Promise<GoogleEvent[]> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await res.json();
  return data.items ?? [];
}
