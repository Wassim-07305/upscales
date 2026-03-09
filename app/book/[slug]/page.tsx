import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PublicBookingPageData } from "@/lib/types/database";
import BookingClient from "./BookingClient";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BookingPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_booking_page_by_slug", {
    _slug: slug,
  });

  if (!data) {
    return { title: "Page introuvable — UPSCALE" };
  }

  const page = data as PublicBookingPageData;

  return {
    title: page.title
      ? `${page.title} — Réservation`
      : "Réservation — UPSCALE",
    description:
      page.description ?? "Réservez votre créneau en quelques clics.",
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_booking_page_by_slug", {
    _slug: slug,
  });

  if (error || !data) {
    notFound();
  }

  const page = data as PublicBookingPageData;

  return <BookingClient page={page} />;
}
