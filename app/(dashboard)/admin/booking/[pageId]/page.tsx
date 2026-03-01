import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { BookingPageDetail } from "./BookingPageDetail";

interface BookingPageDetailPageProps {
  params: Promise<{ pageId: string }>;
}

export default async function BookingPageDetailPage({
  params,
}: BookingPageDetailPageProps) {
  const { pageId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isModerator(profile.role)) redirect("/dashboard");

  // Parallelize independent queries
  const [
    { data: bookingPage },
    { data: availability },
    { data: exceptions },
    { data: bookings },
  ] = await Promise.all([
    supabase
      .from("booking_pages")
      .select("*")
      .eq("id", pageId)
      .single(),
    supabase
      .from("booking_availability")
      .select("*")
      .eq("booking_page_id", pageId)
      .order("day_of_week")
      .order("start_time"),
    supabase
      .from("booking_exceptions")
      .select("*")
      .eq("booking_page_id", pageId)
      .order("exception_date"),
    supabase
      .from("bookings")
      .select("*")
      .eq("booking_page_id", pageId)
      .order("date", { ascending: false }),
  ]);

  if (!bookingPage) notFound();

  return (
    <BookingPageDetail
      bookingPage={bookingPage}
      availability={availability || []}
      exceptions={exceptions || []}
      bookings={bookings || []}
    />
  );
}
