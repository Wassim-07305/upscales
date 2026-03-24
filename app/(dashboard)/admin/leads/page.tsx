import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { LeadsClient } from "./LeadsClient";

export default async function LeadsPage() {
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

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  return <LeadsClient leads={leads || []} userId={user.id} />;
}
