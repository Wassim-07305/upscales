"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useBookingPageBySlug,
  useTrackPageView,
} from "@/hooks/use-booking-pages";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { CalendarCheck, Loader2 } from "lucide-react";

export default function PublicBookingPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { data: page, isLoading, error } = useBookingPageBySlug(slug);
  const trackView = useTrackPageView();

  // Track page view once
  useEffect(() => {
    if (page?.id) {
      trackView.mutate(page.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <CalendarCheck className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Page introuvable
          </h1>
          <p className="text-zinc-400">
            Cette page de réservation n&apos;existe pas ou n&apos;est plus
            active.
          </p>
        </div>
      </div>
    );
  }

  return <BookingFlow page={page} />;
}
