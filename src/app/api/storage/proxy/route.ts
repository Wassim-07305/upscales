import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const B2_CONFIGURED = !!(
  process.env.B2_KEY_ID &&
  process.env.B2_APP_KEY &&
  process.env.B2_BUCKET_NAME &&
  process.env.B2_REGION &&
  process.env.B2_ENDPOINT
);

// SVG placeholder retourné quand B2 n'est pas configuré ou fichier introuvable
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f3f4f6"/>
  <rect x="150" y="100" width="100" height="70" rx="8" fill="#d1d5db"/>
  <circle cx="175" cy="120" r="12" fill="#9ca3af"/>
  <polygon points="155,165 200,125 245,165" fill="#9ca3af"/>
</svg>`;

/**
 * Proxy pour servir les fichiers B2 privés.
 * Streame le contenu directement au lieu de rediriger (evite les problemes CORS Safari).
 *
 * Usage: /api/storage/proxy?key=avatars/user-123/photo.jpg
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  // Si B2 n'est pas configuré, retourner un placeholder immédiatement
  if (!B2_CONFIGURED) {
    return new NextResponse(PLACEHOLDER_SVG, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  try {
    const { getSignedUrl } = await import("@/lib/b2");
    const signedUrl = await getSignedUrl(key, 4 * 3600); // 4 heures

    // Streamer le contenu au lieu de rediriger (evite CORS Safari)
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error(`B2 returned ${response.status}`);

    const contentType =
      response.headers.get("content-type") ?? "application/octet-stream";
    const body = response.body;

    // Pas de cache pour les avatars (changent frequemment), cache court sinon
    const isAvatar = key.startsWith("avatars/");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": isAvatar
          ? "no-cache, no-store, must-revalidate"
          : "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    // Fichier introuvable sur B2 — retourner un placeholder
    return new NextResponse(PLACEHOLDER_SVG, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
}
