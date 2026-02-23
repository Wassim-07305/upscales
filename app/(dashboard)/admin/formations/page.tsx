import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/utils/roles";
import { AdminFormationsClient } from "./AdminFormationsClient";

export default async function AdminFormationsPage() {
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

  const { data: formations } = await supabase
    .from("formations")
    .select("*")
    .order("order");

  // Get enrollment counts
  const { data: enrollments } = await supabase
    .from("formation_enrollments")
    .select("formation_id");

  const formationsWithCounts = formations?.map((f) => ({
    ...f,
    enrolled_count: enrollments?.filter((e) => e.formation_id === f.id).length || 0,
  })) || [];

  return <AdminFormationsClient formations={formationsWithCounts} />;
}
