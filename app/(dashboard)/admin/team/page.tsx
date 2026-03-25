import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { TeamClient } from "./TeamClient";
import { SubNav } from "@/components/layout/sub-nav";

export default async function TeamPage() {
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

  const [{ data: timeEntries }, { data: meetings }, { data: members }] = await Promise.all([
    supabase.from("time_entries").select("*").order("entry_date", { ascending: false }),
    supabase.from("meeting_notes").select("*").order("meeting_date", { ascending: false }),
    supabase.from("profiles").select("id, full_name").in("role", ["admin", "moderator", "member"]).order("full_name"),
  ]);

  return (
    <>
      <SubNav tabs={[{ label: "Paramètres", href: "/admin/settings" }, { label: "Équipe", href: "/admin/team" }, { label: "Channels", href: "/admin/channels" }, { label: "Modération", href: "/admin/moderation" }, { label: "Outils", href: "/admin/tools" }, { label: "Audit", href: "/admin/audit" }, { label: "Logs", href: "/admin/error-logs" }]} />
      <TeamClient
        timeEntries={timeEntries || []}
        meetings={meetings || []}
        members={members || []}
        userId={user.id}
      />
    </>
  );
}
