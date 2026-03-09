import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: certificate } = await supabase
    .from("certificates")
    .select("*, formation:formations(title), user:profiles(full_name)")
    .eq("id", id)
    .single();

  if (!certificate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify ownership or admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (certificate.user_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Generate a simple HTML certificate as PDF alternative
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Certificat - ${(certificate.formation as any)?.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 40px;
          background: #0D0D0D;
          color: #EDEDED;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .certificate {
          background: linear-gradient(135deg, #141414, #1C1C1C);
          border: 2px solid #C6FF00;
          border-radius: 24px;
          padding: 60px;
          max-width: 800px;
          width: 100%;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .certificate::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #C6FF00, #7FFFD4, #C6FF00);
        }
        .logo {
          font-size: 32px;
          font-weight: 700;
          color: #C6FF00;
          margin-bottom: 8px;
          letter-spacing: 4px;
        }
        .subtitle {
          color: #999999;
          font-size: 14px;
          margin-bottom: 40px;
        }
        .heading {
          font-size: 18px;
          color: #999999;
          margin-bottom: 12px;
        }
        .name {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 32px;
          background: linear-gradient(135deg, #EDEDED, #999999);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .formation {
          font-size: 24px;
          font-weight: 600;
          color: #C6FF00;
          margin-bottom: 40px;
        }
        .meta {
          display: flex;
          justify-content: center;
          gap: 40px;
          color: #999999;
          font-size: 12px;
        }
        .meta-item strong {
          display: block;
          color: #EDEDED;
          font-size: 14px;
          margin-top: 4px;
        }
        @media print {
          body { background: white; color: black; }
          .certificate { border-color: #C6FF00; background: white; }
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="logo">UPSCALE</div>
        <div class="subtitle">Plateforme de Formation</div>
        <div class="heading">Certificat de complétion délivré à</div>
        <div class="name">${(certificate as any).user?.full_name || "Participant"}</div>
        <div class="heading">Pour avoir complété avec succès la formation</div>
        <div class="formation">${(certificate.formation as any)?.title || "Formation"}</div>
        <div class="meta">
          <div class="meta-item">
            Date de délivrance
            <strong>${new Date(certificate.issued_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}</strong>
          </div>
          <div class="meta-item">
            Numéro de certificat
            <strong>${certificate.certificate_number}</strong>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
