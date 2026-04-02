import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFile } from "fs/promises";
import { join } from "path";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Remplit le PDF du contrat UPSCALE avec les infos du client.
 * Si save=true et contract_id fourni, sauvegarde le PDF dans Supabase Storage
 * et met a jour la colonne signed_pdf_url du contrat.
 */
export async function POST(request: Request) {
  try {
    const { signer_name, address, city, signature_image, contract_id, save } =
      await request.json();

    // Charger le PDF original
    const pdfPath = join(process.cwd(), "public", "contrat-upscale.pdf");
    const pdfBytes = await readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    // ─── Page 1 : Remplir les infos client ───────────────────
    const page1 = pages[0];
    const textColor = rgb(0.1, 0.1, 0.1);
    const fontSize = 11;
    const pageHeight = page1.getHeight();

    page1.drawText(signer_name || "", {
      x: 390,
      y: pageHeight - 371,
      size: fontSize,
      font: fontBold,
      color: textColor,
    });

    page1.drawText(address || "", {
      x: 370,
      y: pageHeight - 392,
      size: fontSize,
      font,
      color: textColor,
    });

    page1.drawText(city || "", {
      x: 410,
      y: pageHeight - 410,
      size: fontSize,
      font,
      color: textColor,
    });

    // ─── Derniere page : Signature client ────────────────────
    const lastPage = pages[pages.length - 1];
    const lastPageHeight = lastPage.getHeight();

    const dateStr = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());

    lastPage.drawText(dateStr, {
      x: 220,
      y: lastPageHeight - 448,
      size: 10,
      font,
      color: textColor,
    });

    lastPage.drawText("Lu et approuve", {
      x: 320,
      y: lastPageHeight - 535,
      size: 11,
      font: fontBold,
      color: textColor,
    });

    if (signature_image) {
      try {
        const base64Data = signature_image.replace(
          /^data:image\/png;base64,/,
          "",
        );
        const sigBytes = Uint8Array.from(atob(base64Data), (c) =>
          c.charCodeAt(0),
        );
        const sigImage = await pdfDoc.embedPng(sigBytes);
        const sigWidth = 140;
        const sigHeight = (sigImage.height / sigImage.width) * sigWidth;
        lastPage.drawImage(sigImage, {
          x: 350,
          y: lastPageHeight - 580,
          width: sigWidth,
          height: sigHeight,
        });
      } catch {
        // Ignorer si l'image de signature est invalide
      }
    }

    const filledPdfBytes = await pdfDoc.save();

    // ─── Sauvegarder dans Supabase Storage si demande ────────
    if (save && contract_id) {
      try {
        const admin = createAdminClient();
        const fileName = `contracts/${contract_id}/contrat-signe.pdf`;

        await admin.storage
          .from("documents")
          .upload(fileName, Buffer.from(filledPdfBytes), {
            contentType: "application/pdf",
            upsert: true,
          });

        const {
          data: { publicUrl },
        } = admin.storage.from("documents").getPublicUrl(fileName);

        const now = new Date().toISOString();
        await admin
          .from("contracts")
          .update({
            signed_pdf_url: publicUrl,
            status: "signed",
            signed_at: now,
            signature_data: {
              signed_at: now,
              signer_name: signer_name ?? "",
              ip_address: "onboarding",
              user_agent: "onboarding",
            },
            signature_image: signature_image ?? null,
          })
          .eq("id", contract_id);
      } catch (storageErr) {
        console.error("[fill-pdf] Storage error:", storageErr);
        // On continue meme si le storage echoue — le PDF est retourne au client
      }
    }

    return new NextResponse(Buffer.from(filledPdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=contrat-signe.pdf",
      },
    });
  } catch (err) {
    console.error("[fill-pdf] Error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la generation du PDF" },
      { status: 500 },
    );
  }
}
