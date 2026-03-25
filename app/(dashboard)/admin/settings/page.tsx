import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/utils/roles";
import { SettingsForm } from "./SettingsForm";
import { SubNav } from "@/components/layout/sub-nav";

export default async function SettingsPage() {
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

  if (!profile || !isAdmin(profile.role)) redirect("/admin");

  const isGCalEnabled = !!process.env.GOOGLE_CLIENT_ID;
  let isGCalConnected = false;

  if (isGCalEnabled) {
    const { data: gcalToken } = await supabase
      .from("google_calendar_tokens")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    isGCalConnected = !!gcalToken;
  }

  return (
    <>
      <SubNav tabs={[{ label: "Paramètres", href: "/admin/settings" }, { label: "Équipe", href: "/admin/team" }, { label: "Channels", href: "/admin/channels" }, { label: "Modération", href: "/admin/moderation" }, { label: "Outils", href: "/admin/tools" }, { label: "Audit", href: "/admin/audit" }, { label: "Logs", href: "/admin/error-logs" }]} />
      <SettingsForm
        isGCalEnabled={isGCalEnabled}
        isGCalConnected={isGCalConnected}
      />
    </>
  );
}
