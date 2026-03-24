import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { SOPsAdminClient } from "./SOPsClient";

export default async function SOPsAdminPage() {
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

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: sops } = await supabase
    .from("sops")
    .select("*")
    .order("department", { ascending: true })
    .order("order", { ascending: true });

  return <SOPsAdminClient sops={sops || []} />;
}
