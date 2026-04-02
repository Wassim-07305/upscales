import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cree un compte utilisateur a partir d'une invitation.
 * Utilise le admin client pour creer le user (pas de session auto cote client)
 * et force le role correct sur le profil.
 */
export async function POST(request: Request) {
  try {
    const { invite_code, password } = await request.json();

    if (!invite_code || !password) {
      return NextResponse.json(
        { error: "Parametres manquants" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit faire au moins 6 caracteres" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // 1. Trouver l'invitation
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
        { error: "Invitation non trouvee ou expiree" },
        { status: 404 },
      );
    }

    // 2. Creer le user via admin (pas de session cote client)
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email: invite.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: invite.full_name },
      });

    if (authError) {
      // User existe deja
      if (authError.message?.includes("already")) {
        return NextResponse.json(
          { error: "Ce compte existe deja" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Erreur lors de la creation du compte" },
        { status: 500 },
      );
    }

    // 3. Marquer l'invitation comme acceptee
    await admin
      .from("user_invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    // 4. Forcer le role sur le profil (le trigger peut avoir cree le profil en prospect)
    const skipOnboarding = !["client", "prospect"].includes(invite.role);
    await admin.from("profiles").upsert(
      {
        id: userId,
        email: invite.email.toLowerCase(),
        full_name: invite.full_name,
        role: invite.role,
        onboarding_completed: skipOnboarding,
      },
      { onConflict: "id" },
    );

    return NextResponse.json({ success: true, role: invite.role });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[Register] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
