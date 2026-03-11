import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: notifications }, { data: profile }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", user.id)
      .single(),
  ]);

  // Filtrer côté serveur selon les préférences
  const prefs = profile?.notification_preferences as Record<string, boolean> | null;
  const filtered = prefs
    ? (notifications || []).filter((n) => prefs[n.type] !== false)
    : notifications || [];

  return <NotificationsClient initialNotifications={filtered} />;
}
