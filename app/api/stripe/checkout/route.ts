import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSchema } from "@/lib/validations";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Validate input
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête JSON invalide" },
      { status: 400 }
    );
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { formation_id } = parsed.data;
  const admin = createAdminClient();

  // Get formation details
  const { data: formation, error: formationError } = await admin
    .from("formations")
    .select("id, title, price, is_free, status, thumbnail_url")
    .eq("id", formation_id)
    .eq("status", "published")
    .single();

  if (formationError || !formation) {
    return NextResponse.json(
      { error: "Formation introuvable" },
      { status: 404 }
    );
  }

  if (formation.is_free || !formation.price || formation.price <= 0) {
    return NextResponse.json(
      { error: "Cette formation est gratuite, pas besoin de paiement" },
      { status: 400 }
    );
  }

  // Check if already enrolled
  const { data: existingEnrollment } = await admin
    .from("formation_enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("formation_id", formation_id)
    .single();

  if (existingEnrollment) {
    return NextResponse.json(
      { error: "Vous êtes déjà inscrit à cette formation" },
      { status: 400 }
    );
  }

  // Get or create Stripe customer
  let stripeCustomerId: string;

  const { data: existingCustomer } = await admin
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (existingCustomer) {
    stripeCustomerId = existingCustomer.stripe_customer_id;
  } else {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email,
      name: profile?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    });

    stripeCustomerId = customer.id;

    await admin.from("stripe_customers").insert({
      user_id: user.id,
      stripe_customer_id: customer.id,
    });
  }

  // Create Checkout Session
  const amountCents = Math.round(formation.price * 100);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: formation.title,
            description: `Accès à la formation "${formation.title}" sur UPSCALE`,
            ...(formation.thumbnail_url ? { images: [formation.thumbnail_url] } : {}),
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      formation_id,
      user_id: user.id,
    },
    success_url: `${siteUrl}/formations/${formation_id}?payment=success`,
    cancel_url: `${siteUrl}/formations/${formation_id}?payment=cancel`,
  });

  // Record pending payment
  await admin.from("payments").insert({
    user_id: user.id,
    formation_id,
    stripe_session_id: session.id,
    amount_cents: amountCents,
    currency: "eur",
    status: "pending",
  });

  return NextResponse.json({ url: session.url });
}
