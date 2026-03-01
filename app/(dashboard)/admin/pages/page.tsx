import { createClient } from "@/lib/supabase/server";
import { PagesAdminClient } from "./PagesAdminClient";

export default async function AdminPagesPage() {
  const supabase = await createClient();

  const { data: pages } = await supabase
    .from("landing_pages")
    .select("*")
    .order("created_at", { ascending: false });

  return <PagesAdminClient pages={pages || []} />;
}
