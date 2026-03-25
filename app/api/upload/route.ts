import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const rl = checkRateLimit(`upload:${ip}`, { limit: 30, windowSeconds: 60 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const bucket = (formData.get("bucket") as string) || "media";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Limites de taille : 10 Mo images, 50 Mo vidéos
  const isVideo = file.type.startsWith("video/");
  const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  const maxLabel = isVideo ? "50 Mo" : "10 Mo";

  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `Fichier trop volumineux (max ${maxLabel})` },
      { status: 413 }
    );
  }

  const ext = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${ext}`;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[Upload] SUPABASE_SERVICE_ROLE_KEY is missing");
    return NextResponse.json({ error: "Upload non configuré (service role key manquante)" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .upload(fileName, file, {
      upsert: true,
    });

  if (error) {
    console.error("[Upload Error]", { bucket, fileName, message: error.message, cause: (error as any).cause });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(bucket).getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl, path: data.path });
}
