import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyPagesWrapper } from "./MyPagesWrapper";

export default async function MyPagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pages } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  return <MyPagesWrapper pages={pages || []} />;
}
