import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RessourcesClient } from "./RessourcesClient";

export default async function RessourcesPage() {
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

  if (!profile) redirect("/login");

  // RLS filters by role automatically
  const { data: sops } = await supabase
    .from("sops")
    .select("*")
    .eq("is_published", true)
    .order("department", { ascending: true })
    .order("order", { ascending: true });

  return <RessourcesClient sops={sops || []} />;
}
