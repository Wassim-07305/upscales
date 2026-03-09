import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function FullscreenLayout({
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

  // Vérifier le rôle admin/moderator
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
