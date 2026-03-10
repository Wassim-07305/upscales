import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { formationId } = await request.json();

  if (!formationId) {
    return NextResponse.json({ error: "Formation manquante" }, { status: 400 });
  }

  // Fetch formation details
  const { data: formation } = await supabase
    .from("formations")
    .select("id, title, price, is_free, thumbnail_url")
    .eq("id", formationId)
    .single();

  if (!formation) {
    return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
  }

  if (formation.is_free || !formation.price) {
    return NextResponse.json({ error: "Cette formation est gratuite" }, { status: 400 });
  }

  // Check if already enrolled
  const { data: existing } = await supabase
    .from("formation_enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("formation_id", formationId)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Déjà inscrit" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Create Stripe Checkout session
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: user.email,
    metadata: {
      user_id: user.id,
      formation_id: formationId,
    },
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: formation.title,
            description: `Accès à la formation "${formation.title}"`,
            ...(formation.thumbnail_url ? { images: [formation.thumbnail_url] } : {}),
          },
          unit_amount: Math.round(Number(formation.price) * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${siteUrl}/formations/${formationId}?payment=success`,
    cancel_url: `${siteUrl}/formations/${formationId}?payment=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
