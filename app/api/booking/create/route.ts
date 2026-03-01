import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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

  return NextResponse.json({ booking: data });
}
