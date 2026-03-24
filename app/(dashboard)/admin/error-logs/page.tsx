import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ErrorLogsClient } from "./ErrorLogsClient";

export default async function ErrorLogsPage() {
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

  if (!profile || profile.role !== "admin") redirect("/admin");

  const { data: logs, count } = await supabase
    .from("error_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(200);

  return <ErrorLogsClient initialLogs={logs || []} totalCount={count || 0} />;
}
