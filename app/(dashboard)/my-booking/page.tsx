import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyBookingClient } from "./MyBookingClient";

export default async function MyBookingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: bookingPages } = await supabase
    .from("booking_pages")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  const pageIds = (bookingPages || []).map((p) => p.id);

  const { data: recentBookings } = pageIds.length > 0
    ? await supabase
        .from("bookings")
        .select("*, booking_page:booking_pages(title, slug)")
        .in("booking_page_id", pageIds)
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <MyBookingClient
      bookingPages={bookingPages || []}
      recentBookings={recentBookings || []}
    />
  );
}
