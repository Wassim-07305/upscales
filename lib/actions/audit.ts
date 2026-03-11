"use server";

import { createClient } from "@/lib/supabase/server";

export async function logAuditAction(
  action: string,
  targetType: string,
  targetId?: string,
  details?: Record<string, unknown>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action,
    target_type: targetType,
    target_id: targetId || null,
    details: details || {},
  });
}
