import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { BookingAdminClient } from "./BookingAdminClient";
import { SubNav } from "@/components/layout/sub-nav";

export default async function BookingAdminPage() {
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

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Parallelize independent queries
  const [{ data: bookingPages }, { data: recentBookings }] = await Promise.all([
    supabase
      .from("booking_pages")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select("*, booking_page:booking_pages(title, slug)")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <SubNav tabs={[{ label: "Calendrier", href: "/admin/calendar" }, { label: "Booking", href: "/admin/booking" }]} />
      <BookingAdminClient
        bookingPages={bookingPages || []}
        recentBookings={recentBookings || []}
      />
    </>
  );
}
