import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import {
  NAV_SECTIONS,
  NAV_ITEMS,
  QUICK_LINKS,
  BREADCRUMB_LABELS,
} from "@/lib/constants/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <AppShell
      role={profile.role}
      userName={profile.full_name || profile.email}
      email={profile.email}
      avatarUrl={profile.avatar_url}
      userId={profile.id}
      navSections={NAV_SECTIONS}
      navItems={NAV_ITEMS}
      quickLinks={QUICK_LINKS}
      breadcrumbLabels={BREADCRUMB_LABELS}
      logoSrc="/icons/icon-48x48.png"
      appName={
        <span className="font-display font-bold tracking-tight">UPSCALE</span>
      }
      adminRoles={["admin", "moderator"]}
    >
      {children}
    </AppShell>
  );
}
