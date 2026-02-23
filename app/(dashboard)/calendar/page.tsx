import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CalendarClient } from "./CalendarClient";

export default async function CalendarPage() {
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

  // Fetch sessions
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, host:profiles(full_name, avatar_url)")
    .order("start_time");

  // Fetch user's registrations
  const { data: registrations } = await supabase
    .from("session_participants")
    .select("session_id")
    .eq("user_id", user.id);

  // Fetch participant counts
  const sessionIds = sessions?.map((s) => s.id) || [];
  const { data: participants } = sessionIds.length > 0
    ? await supabase
        .from("session_participants")
        .select("session_id")
        .in("session_id", sessionIds)
    : { data: [] };

  const sessionsWithCounts = sessions?.map((s) => ({
    ...s,
    participants_count: participants?.filter((p) => p.session_id === s.id).length || 0,
    is_registered: registrations?.some((r) => r.session_id === s.id) || false,
  })) || [];

  return (
    <CalendarClient
      sessions={sessionsWithCounts}
      userId={user.id}
      userRole={profile?.role || "prospect"}
    />
  );
}
