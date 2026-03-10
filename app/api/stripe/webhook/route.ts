import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Signature manquante" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature invalide";
    console.error("[Stripe Webhook] Verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const formationId = session.metadata?.formation_id;
      const userId = session.metadata?.user_id;

      if (!formationId || !userId) {
        console.error("[Stripe Webhook] Missing metadata on session", session.id);
        break;
      }

      // Update payment status
      await admin
        .from("payments")
        .update({
          status: "completed",
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
        })
        .eq("stripe_session_id", session.id);

      // Enroll user in formation
      await admin.from("formation_enrollments").upsert(
        {
          user_id: userId,
          formation_id: formationId,
        },
        { onConflict: "user_id,formation_id" }
      );

      // Notify user
      await admin.from("notifications").insert({
        user_id: userId,
        type: "formation",
        title: "Paiement confirmé",
        message: "Votre paiement a été accepté. Vous avez maintenant accès à la formation.",
        link: `/formations/${formationId}`,
      });

      // Upgrade prospect to member if needed
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profile?.role === "prospect") {
        await admin
          .from("profiles")
          .update({ role: "member" })
          .eq("id", userId);
      }

      console.log(
        `[Stripe Webhook] checkout.session.completed: user=${userId} formation=${formationId}`
      );
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Update payment record if exists
      await admin
        .from("payments")
        .update({ status: "completed" })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      console.log(
        `[Stripe Webhook] payment_intent.succeeded: ${paymentIntent.id}`
      );
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      await admin
        .from("payments")
        .update({ status: "failed" })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      // Notify user if metadata available
      const userId = paymentIntent.metadata?.user_id;
      if (userId) {
        await admin.from("notifications").insert({
          user_id: userId,
          type: "system",
          title: "Échec de paiement",
          message:
            "Votre paiement n'a pas abouti. Veuillez réessayer ou contacter le support.",
          link: "/dashboard",
        });
      }

      console.log(
        `[Stripe Webhook] payment_intent.payment_failed: ${paymentIntent.id}`
      );
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

      if (paymentIntentId) {
        await admin
          .from("payments")
          .update({ status: "refunded" })
          .eq("stripe_payment_intent_id", paymentIntentId);
      }

      console.log(`[Stripe Webhook] charge.refunded: ${charge.id}`);
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
