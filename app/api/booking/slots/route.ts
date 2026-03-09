import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const date = searchParams.get("date");

  if (!slug || !date) {
    return NextResponse.json(
      { error: "Les parametres 'slug' et 'date' sont requis." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_available_slots", {
    _slug: slug,
    _date: date,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ slots: data });
}
