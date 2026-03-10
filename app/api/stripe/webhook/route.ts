import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Use service role for webhook (no user context)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const formationId = session.metadata?.formation_id;

    if (userId && formationId) {
      const supabase = getAdminClient();

      // Enroll user
      await supabase.from("formation_enrollments").upsert(
        {
          user_id: userId,
          formation_id: formationId,
        },
        { onConflict: "user_id,formation_id" }
      );

      // Store payment record
      await supabase.from("payments").insert({
        user_id: userId,
        formation_id: formationId,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency || "eur",
        status: "completed",
      });

      // Create notification
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "formation",
        title: "Paiement confirmé",
        body: `Votre inscription a été confirmée. Bonne formation !`,
        link: `/formations/${formationId}`,
      });
    }
  }

  return NextResponse.json({ received: true });
}
