import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/utils/roles";
import { SubNav } from "@/components/layout/sub-nav";
import { BroadcastClient } from "./BroadcastClient";

const communicationTabs = [
  { label: "Chat", href: "/chat" },
  { label: "Annonces", href: "/admin/broadcast" },
];

export default async function BroadcastPage() {
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

  if (!profile || !isAdmin(profile.role)) redirect("/dashboard");

  // Récupérer les stats pour le ciblage
  const [
    { count: totalUsers },
    { count: adminCount },
    { count: moderatorCount },
    { count: memberCount },
    { count: prospectCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "moderator"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "member"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "prospect"),
  ]);

  return (
    <>
      <SubNav tabs={communicationTabs} />
      <BroadcastClient
      userId={user.id}
      stats={{
        total: totalUsers || 0,
        admin: adminCount || 0,
        moderator: moderatorCount || 0,
        member: memberCount || 0,
        prospect: prospectCount || 0,
      }}
      />
    </>
  );
}
