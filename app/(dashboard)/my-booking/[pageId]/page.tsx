import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { MyBookingPageDetail } from "./MyBookingPageDetail";

export default async function MyBookingDetailPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: bookingPage }, { data: availability }, { data: exceptions }, { data: bookings }] = await Promise.all([
    supabase.from("booking_pages").select("*").eq("id", pageId).eq("created_by", user.id).single(),
    supabase.from("booking_availability").select("*").eq("booking_page_id", pageId).order("day_of_week").order("start_time"),
    supabase.from("booking_exceptions").select("*").eq("booking_page_id", pageId).order("exception_date"),
    supabase.from("bookings").select("*").eq("booking_page_id", pageId).order("date", { ascending: false }),
  ]);

  if (!bookingPage) notFound();

  return (
    <MyBookingPageDetail
      bookingPage={bookingPage}
      availability={availability || []}
      exceptions={exceptions || []}
      bookings={bookings || []}
    />
  );
}
