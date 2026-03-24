import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { OKRsClient } from "./OKRsClient";

export default async function OKRsPage() {
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

  const isAdmin = profile.role === "admin";

  // Fetch periods with objectives and key results
  const { data: periods } = await supabase
    .from("okr_periods")
    .select("*")
    .order("start_date", { ascending: false });

  const periodIds = (periods || []).map((p) => p.id);

  const [{ data: objectives }, { data: keyResults }] = await Promise.all([
    periodIds.length > 0
      ? supabase
          .from("okr_objectives")
          .select("*")
          .in("period_id", periodIds)
          .order("order", { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
    periodIds.length > 0
      ? supabase
          .from("okr_key_results")
          .select("*")
          .in(
            "objective_id",
            (
              await supabase
                .from("okr_objectives")
                .select("id")
                .in("period_id", periodIds)
            ).data?.map((o) => o.id) || []
          )
          .order("order", { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
  ]);

  // Assemble nested structure
  const assembledPeriods = (periods || []).map((period) => ({
    ...period,
    objectives: (objectives || [])
      .filter((o) => o.period_id === period.id)
      .map((obj) => ({
        ...obj,
        key_results: (keyResults || []).filter(
          (kr) => kr.objective_id === obj.id
        ),
      })),
  }));

  return (
    <div className="space-y-6">
      <OKRsClient periods={assembledPeriods} isAdmin={isAdmin} />
    </div>
  );
}
