import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Generate iCal format for a session
function generateICS(session: {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  host_name?: string;
}): string {
  const formatDate = (date: string) => {
    return new Date(date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const escapeText = (text: string) => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Upscale//Session//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${session.id}@upscale`,
    `DTSTAMP:${formatDate(new Date().toISOString())}`,
    `DTSTART:${formatDate(session.start_time)}`,
    `DTEND:${formatDate(session.end_time)}`,
    `SUMMARY:${escapeText(session.title)}`,
  ];

  if (session.description) {
    lines.push(`DESCRIPTION:${escapeText(session.description)}`);
  }

  if (session.location) {
    lines.push(`LOCATION:${escapeText(session.location)}`);
  }

  if (session.host_name) {
    lines.push(`ORGANIZER;CN=${escapeText(session.host_name)}:mailto:noreply@upscale.fr`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*, host:profiles(full_name)")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  const host = session.host as { full_name: string } | null;

  const ics = generateICS({
    id: session.id,
    title: session.title,
    description: session.description,
    start_time: session.start_time,
    end_time: session.end_time,
    location: session.location,
    host_name: host?.full_name,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${session.title.replace(/[^a-zA-Z0-9]/g, "-")}.ics"`,
    },
  });
}
