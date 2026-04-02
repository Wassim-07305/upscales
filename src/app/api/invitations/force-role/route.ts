import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Force le role d'un profil a partir du code d'invitation.
 * Cherche l'invitation par code (peu importe le status pending/accepted)
 * et met a jour le profil correspondant par email.
 *
 * Appele apres signUp pour s'assurer que le role est correct,
 * meme si le trigger handle_new_user n'a pas matche l'invitation.
 */
export async function POST(request: Request) {
  try {
    const { invite_code } = await request.json();

    if (!invite_code) {
      return NextResponse.json(
        { error: "invite_code requis" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Trouver l'invitation par code (status = pending OU accepted)
    const { data: invite } = await admin
      .from("user_invites")
      .select("id, email, role, full_name")
      .eq("invite_code", invite_code)
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!invite) {
      return NextResponse.json(
        { error: "Invitation non trouvee" },
        { status: 404 },
      );
    }

    // Marquer comme accepted si encore pending
    await admin
      .from("user_invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id)
      .eq("status", "pending");

    // Trouver le profil par email (case-insensitive)
    const { data: profile } = await admin
      .from("profiles")
      .select("id, role")
      .ilike("email", invite.email)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Profil non trouve" }, { status: 404 });
    }

    // Forcer le role si different
    if (profile.role !== invite.role) {
      const skipOnboarding = !["client", "prospect"].includes(invite.role);
      await admin
        .from("profiles")
        .update({
          role: invite.role,
          full_name: invite.full_name,
          onboarding_completed: skipOnboarding,
        })
        .eq("id", profile.id);
    }

    return NextResponse.json({ success: true, role: invite.role });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[ForceRole] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
