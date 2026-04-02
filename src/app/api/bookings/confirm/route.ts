import { NextResponse } from "next/server";
import { z } from "zod";
import { google } from "googleapis";
import { sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOAuth2Client } from "@/lib/google-calendar";

const schema = z.object({
  prospect_name: z.string().min(1),
  prospect_email: z.string().email(),
  date: z.string(),
  start_time: z.string(),
  end_time: z.string().optional(),
  coach_name: z.string().optional(),
  page_title: z.string().optional(),
  booking_page_id: z.string().uuid().optional(),
  booking_id: z.string().uuid().optional(),
});

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildConfirmationEmail(params: {
  name: string;
  date: string;
  time: string;
  endTime?: string;
  coachName?: string;
  pageTitle?: string;
}): string {
  const timeRange = params.endTime
    ? `${params.time} - ${params.endTime}`
    : params.time;

  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e4e4e7; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto;">
    <h1 style="font-size: 24px; color: #fff; margin-bottom: 8px;">Rendez-vous confirme</h1>
    <p style="color: #a1a1aa; line-height: 1.6;">
      Bonjour ${params.name}, votre rendez-vous est bien confirme.
    </p>

    <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 24px 0;">
      ${
        params.pageTitle
          ? `<p style="color: #a1a1aa; font-size: 13px; margin: 0 0 12px;">
        <strong style="color: #fff;">${params.pageTitle}</strong>
      </p>`
          : ""
      }
      <p style="color: #fff; font-size: 15px; margin: 0 0 8px;">
        📅 ${formatDate(params.date)}
      </p>
      <p style="color: #fff; font-size: 15px; margin: 0 0 8px;">
        🕐 ${timeRange}
      </p>
      ${
        params.coachName
          ? `<p style="color: #a1a1aa; font-size: 14px; margin: 0;">
        Avec ${params.coachName}
      </p>`
          : ""
      }
    </div>

    <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5;">
      Un rappel vous sera envoye la veille et 1h avant le rendez-vous. Si vous devez annuler, merci de nous prevenir au plus tot.
    </p>

    <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;" />
    <p style="color: #52525b; font-size: 12px;">UPSCALE — Programme d'accompagnement freelance</p>
  </div>
</body>
</html>`;
}

async function createGoogleCalendarEvent(params: {
  bookingPageId: string;
  bookingId: string;
  prospectName: string;
  prospectEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  pageTitle?: string;
}) {
  const admin = createAdminClient();

  // 1. Récupérer le propriétaire de la booking page
  const { data: page } = await admin
    .from("booking_pages")
    .select("created_by")
    .eq("id", params.bookingPageId)
    .single();

  if (!page?.created_by) throw new Error("booking_page sans created_by");

  // 2. Récupérer les tokens Google Calendar du coach
  const { data: tokenRow } = await admin
    .from("google_calendar_tokens")
    .select("*")
    .eq("user_id", page.created_by)
    .single();

  if (!tokenRow)
    throw new Error(
      `Aucun token Google Calendar actif pour l'utilisateur ${page.created_by}`,
    );

  // 3. Configurer le client OAuth avec les tokens du coach
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    expiry_date: tokenRow.expires_at
      ? new Date(tokenRow.expires_at).getTime()
      : undefined,
  });

  // Persister le refresh token si renouvelé
  oauth2Client.on("tokens", async (newTokens) => {
    await admin
      .from("google_calendar_tokens")
      .update({
        access_token: newTokens.access_token ?? tokenRow.access_token,
        expires_at: newTokens.expiry_date
          ? new Date(newTokens.expiry_date).toISOString()
          : tokenRow.expires_at,
        ...(newTokens.refresh_token
          ? { refresh_token: newTokens.refresh_token }
          : {}),
      })
      .eq("user_id", page.created_by);
  });

  // 4. Créer l'événement
  const calendarApi = google.calendar({ version: "v3", auth: oauth2Client });

  const startDateTime = `${params.date}T${params.startTime}:00`;
  const endDateTime = `${params.date}T${params.endTime}:00`;

  const event = await calendarApi.events.insert({
    calendarId: tokenRow.calendar_id ?? "primary",
    requestBody: {
      summary: params.pageTitle
        ? `${params.pageTitle} — ${params.prospectName}`
        : `RDV — ${params.prospectName}`,
      description: `Réservation confirmée via UPSCALE\nProspect : ${params.prospectName}\nEmail : ${params.prospectEmail}`,
      start: { dateTime: startDateTime, timeZone: "Europe/Paris" },
      end: { dateTime: endDateTime, timeZone: "Europe/Paris" },
      attendees: [
        { email: params.prospectEmail, displayName: params.prospectName },
      ],
      status: "confirmed",
    },
  });

  const googleEventId = event.data.id ?? null;
  const meetLink = event.data.hangoutLink ?? null;

  // 5. Sauvegarder le google_event_id dans la réservation
  if (googleEventId) {
    await admin
      .from("bookings")
      .update({
        google_event_id: googleEventId,
        ...(meetLink ? { meet_link: meetLink } : {}),
      })
      .eq("id", params.bookingId);
  }

  return googleEventId;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Donnees invalides" }, { status: 400 });
    }

    const data = parsed.data;

    // Envoi email de confirmation
    const result = await sendEmail({
      to: data.prospect_email,
      subject: `Rendez-vous confirme — ${formatDate(data.date)} a ${data.start_time}`,
      html: buildConfirmationEmail({
        name: data.prospect_name,
        date: data.date,
        time: data.start_time,
        endTime: data.end_time,
        coachName: data.coach_name,
        pageTitle: data.page_title,
      }),
    });

    // Création événement Google Calendar (synchrone pour détecter les erreurs)
    let calendarEventId: string | null = null;
    let calendarError: string | null = null;
    if (data.booking_page_id && data.booking_id && data.end_time) {
      try {
        calendarEventId = await createGoogleCalendarEvent({
          bookingPageId: data.booking_page_id,
          bookingId: data.booking_id,
          prospectName: data.prospect_name,
          prospectEmail: data.prospect_email,
          date: data.date,
          startTime: data.start_time,
          endTime: data.end_time,
          pageTitle: data.page_title,
        });
      } catch (calErr) {
        calendarError =
          calErr instanceof Error ? calErr.message : String(calErr);
        console.error("Calendar event creation failed:", calendarError);
      }
    }

    return NextResponse.json({
      success: result.success,
      id: result.id,
      calendarEventId,
      calendarError,
    });
  } catch (err) {
    console.error("Booking confirmation email error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
