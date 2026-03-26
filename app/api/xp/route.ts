import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Points XP par action
const XP_ACTIONS: Record<string, number> = {
  module_complete: 25,
  quiz_pass: 50,
  post_create: 10,
  formation_complete: 200,
  referral_signup: 100,
};

interface BadgeCriteria {
  type: string;
  count: number;
}

interface BadgeRow {
  id: string;
  name: string;
  xp_reward: number;
  criteria: BadgeCriteria;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const action = body.action as string;

  if (!action || !(action in XP_ACTIONS)) {
    return NextResponse.json(
      { error: "Action invalide", actions_valides: Object.keys(XP_ACTIONS) },
      { status: 400 }
    );
  }

  const xpAmount = XP_ACTIONS[action];
  const admin = createAdminClient();

  // Pour le parrainage, l'XP va au parrain (pas besoin d'auth car appelé à l'inscription)
  const referrerId = body.referrer_id || (body.metadata as Record<string, unknown>)?.referrer_id;
  let targetUserId: string;

  if (action === "referral_signup" && referrerId) {
    const referrerIdStr = referrerId as string;

    // Empêcher l'auto-parrainage
    if (referrerIdStr === user.id) {
      return NextResponse.json(
        { error: "Auto-parrainage non autorisé" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur n'a pas déjà utilisé un parrainage
    const { data: existingReferral } = await admin
      .from("xp_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("action", "referral_signup")
      .maybeSingle();

    if (existingReferral) {
      return NextResponse.json(
        { error: "Parrainage déjà utilisé" },
        { status: 400 }
      );
    }

    // Vérifier que le parrain existe dans profiles
    const { data: referrerProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", referrerIdStr)
      .maybeSingle();

    if (!referrerProfile) {
      return NextResponse.json(
        { error: "Parrain introuvable" },
        { status: 400 }
      );
    }

    targetUserId = referrerIdStr;
  } else if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  } else {
    targetUserId = user.id;
  }

  // Ajouter l'XP via la fonction SQL
  const { error: xpError } = await admin.rpc("add_user_xp", {
    p_user_id: targetUserId,
    p_xp: xpAmount,
  });

  if (xpError) {
    return NextResponse.json(
      { error: "Erreur lors de l'ajout d'XP", details: xpError.message },
      { status: 500 }
    );
  }

  // Récupérer l'XP et le niveau actuels
  const { data: userXp } = await admin
    .from("user_xp")
    .select("total_xp, level")
    .eq("user_id", user.id)
    .single();

  // Vérifier l'éligibilité aux badges
  const newBadges: string[] = [];

  // Récupérer les badges non encore obtenus
  const { data: availableBadges } = await admin
    .from("badges")
    .select("id, name, xp_reward, criteria")
    .not(
      "id",
      "in",
      `(${(
        await admin
          .from("user_badges")
          .select("badge_id")
          .eq("user_id", user.id)
      ).data
        ?.map((b) => b.badge_id)
        .join(",") || "00000000-0000-0000-0000-000000000000"})`
    );

  if (availableBadges) {
    for (const badge of availableBadges as BadgeRow[]) {
      const criteria = badge.criteria;
      let earned = false;

      switch (criteria.type) {
        case "modules_completed": {
          const { count } = await admin
            .from("module_progress")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("completed", true);
          earned = (count ?? 0) >= criteria.count;
          break;
        }
        case "certificates_earned": {
          const { count } = await admin
            .from("certificates")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id);
          earned = (count ?? 0) >= criteria.count;
          break;
        }
        case "posts_created": {
          const { count } = await admin
            .from("posts")
            .select("id", { count: "exact", head: true })
            .eq("author_id", user.id);
          earned = (count ?? 0) >= criteria.count;
          break;
        }
        case "formations_completed": {
          const { count } = await admin
            .from("certificates")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id);
          earned = (count ?? 0) >= criteria.count;
          break;
        }
      }

      if (earned) {
        // Attribuer le badge
        const { error: badgeError } = await admin
          .from("user_badges")
          .insert({ user_id: user.id, badge_id: badge.id });

        if (!badgeError) {
          newBadges.push(badge.name);

          // Notification de badge obtenu (in-app + push)
          await admin.from("notifications").insert({
            user_id: user.id,
            type: "system",
            title: `Badge obtenu : ${badge.name}`,
            message: `Vous avez débloqué le badge "${badge.name}". Continuez comme ça !`,
            link: "/leaderboard",
          });

          const { pushNotify } = await import("@/lib/notifications-push");
          await pushNotify(user.id, "system", `Badge obtenu : ${badge.name}`, `Vous avez débloqué le badge "${badge.name}".`, "/leaderboard");

          // Attribuer l'XP bonus du badge
          if (badge.xp_reward > 0) {
            await admin.rpc("add_user_xp", {
              p_user_id: user.id,
              p_xp: badge.xp_reward,
            });
          }
        }
      }
    }
  }

  // Récupérer les stats finales (après XP bonus des badges)
  const { data: finalXp } = await admin
    .from("user_xp")
    .select("total_xp, level")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    xp_awarded: xpAmount,
    new_badges: newBadges,
    total_xp: finalXp?.total_xp ?? userXp?.total_xp ?? 0,
    level: finalXp?.level ?? userXp?.level ?? 1,
  });
}
