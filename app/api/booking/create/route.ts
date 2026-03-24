import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";
import { refreshGoogleToken } from "@/lib/gcal/oauth";
import { pushBookingToGCal } from "@/lib/gcal/sync";
import { sendBookingConfirmation } from "@/lib/email/email-service";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const rl = checkRateLimit(`booking:${ip}`, { limit: 10, windowSeconds: 60 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requete JSON invalide." },
      { status: 400 }
    );
  }

  const {
    slug,
    date,
    start_time,
    prospect_name,
    prospect_email,
    prospect_phone,
    qualification_answers,
  } = body as {
    slug?: string;
    date?: string;
    start_time?: string;
    prospect_name?: string;
    prospect_email?: string;
    prospect_phone?: string;
    qualification_answers?: Record<string, unknown>;
  };

  if (!slug || !date || !start_time || !prospect_name || !prospect_email) {
    return NextResponse.json(
      {
        error:
          "Les champs 'slug', 'date', 'start_time', 'prospect_name' et 'prospect_email' sont requis.",
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_booking", {
    _slug: slug,
    _date: date,
    _start_time: start_time,
    _prospect_name: prospect_name,
    _prospect_email: prospect_email,
    _prospect_phone: prospect_phone ?? null,
    _qualification_answers: qualification_answers ?? null,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Fire-and-forget email confirmation
  void sendBookingConfirmation(prospect_email!, {
    name: prospect_name!,
    date: date!,
    time: start_time!,
    pageTitle: slug!,
  }).catch((e) => console.error("[Email booking]", e));

  // Fire-and-forget GCal sync — never blocks the booking response
  if (process.env.GOOGLE_CLIENT_ID) {
    void (async () => {
      try {
        const adminClient = createAdminClient();
        const { data: tokens } = await adminClient
          .from("google_calendar_tokens")
          .select("*")
          .limit(1)
          .single();
        if (!tokens) return;

        let accessToken: string = tokens.access_token;
        if (new Date(tokens.expires_at) <= new Date()) {
          const refreshed = await refreshGoogleToken(tokens.refresh_token);
          accessToken = refreshed.access_token;
          await adminClient
            .from("google_calendar_tokens")
            .update({
              access_token: refreshed.access_token,
              expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", tokens.id);
        }

        const bookingResult = data as { end_time?: string } | null;
        await pushBookingToGCal(accessToken, tokens.calendar_id ?? "primary", {
          prospect_name: prospect_name!,
          prospect_email: prospect_email!,
          prospect_phone: prospect_phone ?? null,
          date: date!,
          start_time: start_time!,
          end_time: bookingResult?.end_time ?? start_time!,
        });
      } catch (e) {
        console.error("[GCal sync]", e);
      }
    })();
  }

  return NextResponse.json({ booking: data });
}
