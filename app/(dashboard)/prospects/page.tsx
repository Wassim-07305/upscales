import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyProspectsClient } from "./MyProspectsClient";

export default async function ProspectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <MyProspectsClient userId={user.id} />;
}
