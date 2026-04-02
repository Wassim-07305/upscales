import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Lock en memoire pour eviter les appels concurrents par user
const pendingUsers = new Set<string>();

/**
 * Genere automatiquement un contrat pour le client connecte.
 * Si un contrat existe deja, le retourne sans en creer un nouveau.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    // Lock en memoire pour eviter les appels concurrents
    if (pendingUsers.has(user.id)) {
      // Attendre un peu puis retourner le contrat existant
      await new Promise((r) => setTimeout(r, 1000));
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("contracts")
        .select("id")
        .eq("client_id", user.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ contract_id: existing.id });
      }
    }

    pendingUsers.add(user.id);

    try {
      const admin = createAdminClient();

      const { data: profile } = await admin
        .from("profiles")
        .select("id, full_name")
        .eq("id", user.id)
        .single();

      const clientName = profile?.full_name ?? "Client";

      // Verifier si un contrat existe deja
      const { data: existingContract } = await admin
        .from("contracts")
        .select("id")
        .eq("client_id", user.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingContract) {
        return NextResponse.json({ contract_id: existingContract.id });
      }

      const { data: template } = await admin
        .from("contract_templates")
        .select("id, title, content")
        .ilike("title", "%Accompagnement%")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!template) {
        return NextResponse.json(
          { error: "Aucun template de contrat actif trouve" },
          { status: 404 },
        );
      }

      const dateStr = new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());

      let content = template.content as string;
      content = content.replace(/\{\{client_name\}\}/g, clientName);
      content = content.replace(/\{\{client_address\}\}/g, "A completer");
      content = content.replace(/\{\{client_city\}\}/g, "A completer");
      content = content.replace(/\{\{date\}\}/g, dateStr);

      const { data: newContract, error: insertError } = await admin
        .from("contracts")
        .insert({
          template_id: template.id,
          client_id: user.id,
          title: template.title,
          content,
          status: "sent",
          sent_at: new Date().toISOString(),
          created_by: user.id,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[contracts/auto-generate] Insert error:", insertError);
        return NextResponse.json(
          { error: "Erreur lors de la creation du contrat" },
          { status: 500 },
        );
      }

      return NextResponse.json({ contract_id: newContract.id });
    } finally {
      pendingUsers.delete(user.id);
    }
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
