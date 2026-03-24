import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendCertificateEarned } from "@/lib/email/email-service";
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#0D0D0D",
    padding: 60,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  border: {
    border: "2px solid #C6FF00",
    borderRadius: 16,
    padding: 50,
    width: "100%",
    alignItems: "center",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#C6FF00",
  },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#C6FF00",
    letterSpacing: 4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#999999",
    marginBottom: 40,
  },
  heading: {
    fontSize: 14,
    color: "#999999",
    marginBottom: 10,
  },
  name: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#EDEDED",
    marginBottom: 28,
  },
  formation: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#C6FF00",
    marginBottom: 40,
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 60,
  },
  metaItem: {
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 10,
    color: "#999999",
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 12,
    color: "#EDEDED",
    fontWeight: "bold",
  },
  decorLeft: {
    position: "absolute",
    bottom: 20,
    left: 20,
    fontSize: 8,
    color: "#333333",
  },
  decorRight: {
    position: "absolute",
    bottom: 20,
    right: 20,
    fontSize: 8,
    color: "#333333",
  },
});

function CertificateDocument({
  studentName,
  formationTitle,
  issuedAt,
  certificateNumber,
}: {
  studentName: string;
  formationTitle: string;
  issuedAt: string;
  certificateNumber: string;
}) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", orientation: "landscape", style: styles.page },
      React.createElement(
        View,
        { style: styles.border },
        React.createElement(View, { style: styles.topBar }),
        React.createElement(Text, { style: styles.logo }, "UPSCALE"),
        React.createElement(Text, { style: styles.subtitle }, "Plateforme de Formation"),
        React.createElement(
          Text,
          { style: styles.heading },
          "Certificat de completion delivre a"
        ),
        React.createElement(Text, { style: styles.name }, studentName),
        React.createElement(
          Text,
          { style: styles.heading },
          "Pour avoir complete avec succes la formation"
        ),
        React.createElement(Text, { style: styles.formation }, formationTitle),
        React.createElement(
          View,
          { style: styles.metaRow },
          React.createElement(
            View,
            { style: styles.metaItem },
            React.createElement(Text, { style: styles.metaLabel }, "Date de delivrance"),
            React.createElement(Text, { style: styles.metaValue }, issuedAt)
          ),
          React.createElement(
            View,
            { style: styles.metaItem },
            React.createElement(Text, { style: styles.metaLabel }, "Numero de certificat"),
            React.createElement(Text, { style: styles.metaValue }, certificateNumber)
          )
        ),
        React.createElement(
          Text,
          { style: styles.decorLeft },
          "Verifie sur upscale.app"
        ),
        React.createElement(
          Text,
          { style: styles.decorRight },
          "Document genere automatiquement"
        )
      )
    )
  );
}

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

  // Générer le QR code de vérification
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://upscales-ahmanewassim6-2668s-projects.vercel.app";
  const verificationUrl = `${siteUrl}/verify/${certificate.certificate_number}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 150,
    margin: 1,
    color: { dark: "#C6FF00", light: "#00000000" },
  });

  const studentName =
    (certificate as Record<string, unknown>).user &&
    typeof (certificate as Record<string, unknown>).user === "object"
      ? ((certificate as Record<string, unknown>).user as { full_name: string }).full_name
      : "Participant";

  const formationTitle =
    (certificate as Record<string, unknown>).formation &&
    typeof (certificate as Record<string, unknown>).formation === "object"
      ? ((certificate as Record<string, unknown>).formation as { title: string }).title
      : "Formation";

  const issuedAt = new Date(certificate.issued_at).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    const pdfBuffer = await renderToBuffer(
      CertificateDocument({
        studentName,
        formationTitle,
        issuedAt,
        certificateNumber: certificate.certificate_number,
      })
    );

    // Fire-and-forget certificate email
    void sendCertificateEarned(user.email!, {
      name: studentName,
      formationTitle,
      certificateNumber: certificate.certificate_number,
    }).catch((e) => console.error("[Email certificate]", e));

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificat-${certificate.certificate_number}.pdf"`,
      },
    });
  } catch {
    // Fallback to HTML if PDF generation fails
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Certificat</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
      body{font-family:'Inter',sans-serif;margin:0;padding:40px;background:#0D0D0D;color:#EDEDED;display:flex;justify-content:center;align-items:center;min-height:100vh}
      .cert{background:linear-gradient(135deg,#141414,#1C1C1C);border:2px solid #C6FF00;border-radius:24px;padding:60px;max-width:800px;width:100%;text-align:center;position:relative;overflow:hidden}
      .cert::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#C6FF00,#7FFFD4,#C6FF00)}
      .logo{font-size:32px;font-weight:700;color:#C6FF00;letter-spacing:4px;margin-bottom:8px}
      .sub{color:#999;font-size:14px;margin-bottom:40px}
      .hd{font-size:18px;color:#999;margin-bottom:12px}
      .nm{font-size:36px;font-weight:700;margin-bottom:32px;background:linear-gradient(135deg,#EDEDED,#999);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      .fm{font-size:24px;font-weight:600;color:#C6FF00;margin-bottom:40px}
      .meta{display:flex;justify-content:center;gap:40px;color:#999;font-size:12px}
      .meta strong{display:block;color:#EDEDED;font-size:14px;margin-top:4px}
      .qr-section{margin-top:40px;padding-top:24px;border-top:1px solid #333}
      @media print{body{background:white;color:black}.cert{border-color:#C6FF00;background:white}}
    </style></head>
    <body><div class="cert"><div class="logo">UPSCALE</div><div class="sub">Plateforme de Formation</div>
    <div class="hd">Certificat de complétion délivré à</div><div class="nm">${studentName}</div>
    <div class="hd">Pour avoir complété avec succès la formation</div><div class="fm">${formationTitle}</div>
    <div class="meta"><div>Date de délivrance<strong>${issuedAt}</strong></div><div>Numéro de certificat<strong>${certificate.certificate_number}</strong></div></div>
    <div class="qr-section">
      <img src="${qrDataUrl}" alt="QR Code de vérification" style="width:120px;height:120px;" />
      <p style="color:#666;font-size:11px;margin-top:8px;">Scannez pour vérifier l&apos;authenticité</p>
    </div></div></body></html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
