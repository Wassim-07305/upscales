import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    const supabase = createAdminClient();

    // Supprimer les error_logs resolus de plus de 30 jours
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: deletedErrors } = await supabase
      .from("error_logs")
      .delete({ count: "exact" })
      .eq("resolved", true)
      .lt("created_at", thirtyDaysAgo);

    // Supprimer les audit_logs de plus de 90 jours
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { count: deletedAudit } = await supabase
      .from("audit_logs")
      .delete({ count: "exact" })
      .lt("created_at", ninetyDaysAgo);

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration_ms: durationMs,
      deleted_errors: deletedErrors || 0,
      deleted_audit: deletedAudit || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Erreur cleanup:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
