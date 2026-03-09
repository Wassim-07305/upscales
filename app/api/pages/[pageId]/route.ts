import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const supabase = await createClient();
  const { pageId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Vérifier le rôle admin/moderator
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { puck_data, title, description, slug, is_active, og_image_url } = body;

  const updateData: Record<string, unknown> = {};
  if (puck_data !== undefined) updateData.puck_data = puck_data;
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (slug !== undefined) updateData.slug = slug;
  if (og_image_url !== undefined) updateData.og_image_url = og_image_url;
  if (is_active !== undefined) {
    updateData.is_active = is_active;
    if (is_active) updateData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("landing_pages")
    .update(updateData)
    .eq("id", pageId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
