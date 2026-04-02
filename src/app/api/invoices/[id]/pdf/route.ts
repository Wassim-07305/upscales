import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // Fetch invoice with client info
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  // Check access: admin sees all, client sees only their own
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    profile?.role !== "admin" &&
    profile?.role !== "coach" &&
    invoice.client_id !== user.id
  ) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  // Get client info
  let clientName = "Client";
  let clientEmail = "";
  if (invoice.client_id) {
    const { data: client } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", invoice.client_id)
      .single();
    if (client) {
      clientName = client.full_name ?? client.email ?? "Client";
      clientEmail = client.email ?? "";
    }
  }

  // Parse line items
  let lineItems = Array.isArray(invoice.line_items)
    ? (invoice.line_items as {
        description: string;
        quantity: number;
        unit_price: number;
        total: number;
      }[])
    : [];

  if (lineItems.length === 0) {
    lineItems = [
      {
        description:
          invoice.title || invoice.description || "Prestation de service",
        quantity: 1,
        unit_price: Number(invoice.amount ?? invoice.total ?? 0),
        total: Number(invoice.total ?? 0),
      },
    ];
  }

  const formatEUR = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(n);

  const statusLabels: Record<string, string> = {
    draft: "Brouillon",
    sent: "Envoyee",
    paid: "Payee",
    overdue: "En retard",
    cancelled: "Annulee",
    partial: "Partiel",
    refunded: "Remboursee",
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: "#f3f4f6", text: "#4b5563" },
    sent: { bg: "#dbeafe", text: "#1e40af" },
    paid: { bg: "#dcfce7", text: "#166534" },
    overdue: { bg: "#fee2e2", text: "#7a9900" },
    cancelled: { bg: "#f3f4f6", text: "#6b7280" },
    partial: { bg: "#fef3c7", text: "#92400e" },
    refunded: { bg: "#ede9fe", text: "#5b21b6" },
  };

  const status = invoice.status ?? "draft";
  const sColor = statusColors[status] ?? statusColors.draft;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>Facture ${invoice.invoice_number ?? id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1a1a2e;
      background: #f8fafc;
      min-height: 100vh;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      min-height: 100vh;
      position: relative;
      overflow: hidden;
    }

    /* Barre rouge en haut */
    .top-bar {
      height: 6px;
      background: linear-gradient(90deg, #c6ff00, #c6ff00, #c6ff00);
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 40px 48px 0;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-section img {
      width: 48px;
      height: 48px;
      border-radius: 10px;
    }
    .brand-name {
      font-size: 22px;
      font-weight: 800;
      color: #c6ff00;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .invoice-badge {
      text-align: right;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: 800;
      color: #1a1a2e;
      letter-spacing: -1px;
    }
    .invoice-number {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
      margin-top: 4px;
    }

    /* Info bar */
    .info-bar {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 20px 48px;
      margin-top: 28px;
      background: #fafbfc;
      border-top: 1px solid #f1f5f9;
      border-bottom: 1px solid #f1f5f9;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 600;
    }
    .info-value {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }
    .info-separator {
      width: 1px;
      height: 32px;
      background: #e2e8f0;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 5px 14px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    /* Parties */
    .parties {
      display: flex;
      justify-content: space-between;
      padding: 32px 48px 0;
      gap: 40px;
    }
    .party {
      flex: 1;
    }
    .party-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #c6ff00;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .party-name {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }
    .party-detail {
      font-size: 13px;
      color: #64748b;
      margin-top: 3px;
      line-height: 1.5;
    }

    /* Table */
    .table-wrapper {
      padding: 32px 48px 0;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }
    thead th {
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 600;
      padding: 12px 16px;
      border-bottom: 2px solid #f1f5f9;
    }
    thead th:last-child { text-align: right; }
    thead th:nth-child(2), thead th:nth-child(3) { text-align: center; }
    tbody td {
      padding: 16px;
      font-size: 14px;
      color: #334155;
      border-bottom: 1px solid #f8fafc;
    }
    tbody td:last-child { text-align: right; font-weight: 600; color: #1e293b; }
    tbody td:nth-child(2), tbody td:nth-child(3) { text-align: center; color: #64748b; }
    tbody tr:hover { background: #fafbfc; }

    /* Totaux */
    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      padding: 24px 48px 0;
    }
    .totals {
      width: 300px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      font-size: 14px;
      color: #64748b;
    }
    .total-row span:last-child {
      font-weight: 600;
      color: #334155;
    }
    .total-row.final {
      margin-top: 12px;
      padding: 16px 20px;
      background: linear-gradient(135deg, #c6ff00, #c6ff00);
      border-radius: 12px;
      color: #fff;
      font-size: 18px;
      font-weight: 700;
    }
    .total-row.final span:last-child {
      color: #fff;
      font-weight: 800;
      font-size: 20px;
    }

    /* Notes */
    .notes {
      margin: 32px 48px 0;
      padding: 16px 20px;
      background: #f8fafc;
      border-left: 3px solid #c6ff00;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      color: #64748b;
      line-height: 1.6;
    }
    .notes strong {
      color: #334155;
    }

    /* Footer */
    .footer {
      margin-top: 48px;
      padding: 20px 48px;
      border-top: 1px solid #f1f5f9;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer-legal {
      font-size: 10px;
      color: #cbd5e1;
      margin-top: 8px;
    }

    /* Bottom bar */
    .bottom-bar {
      height: 6px;
      background: linear-gradient(90deg, #c6ff00, #c6ff00, #c6ff00);
      margin-top: auto;
    }

    @media print {
      body { background: #fff; }
      .page { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="top-bar"></div>

    <div class="header">
      <div class="logo-section">
        <img src="${appUrl}/logo.png" alt="UPSCALE" />
        <div>
          <div class="brand-name">UPSCALE</div>
          <div class="brand-sub">Coaching & Consulting</div>
        </div>
      </div>
      <div class="invoice-badge">
        <div class="invoice-title">FACTURE</div>
        <div class="invoice-number">${invoice.invoice_number ?? "-"}</div>
      </div>
    </div>

    <div class="info-bar">
      <div class="info-item">
        <span class="info-label">Date d'emission</span>
        <span class="info-value">${invoice.created_at ? new Date(invoice.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "-"}</span>
      </div>
      <div class="info-separator"></div>
      ${
        invoice.due_date
          ? `
      <div class="info-item">
        <span class="info-label">Echeance</span>
        <span class="info-value">${new Date(invoice.due_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
      </div>
      <div class="info-separator"></div>
      `
          : ""
      }
      <div class="info-item">
        <span class="info-label">Statut</span>
        <span class="status-pill" style="background:${sColor.bg};color:${sColor.text}">${statusLabels[status] ?? status}</span>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="party-label">Emetteur</div>
        <div class="party-name">UPSCALE</div>
        <div class="party-detail">Coaching & Consulting</div>
      </div>
      <div class="party" style="text-align: right;">
        <div class="party-label">Facture a</div>
        <div class="party-name">${clientName}</div>
        ${clientEmail ? `<div class="party-detail">${clientEmail}</div>` : ""}
      </div>
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantite</th>
            <th>Prix unitaire</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${
            lineItems.length > 0
              ? lineItems
                  .map(
                    (item) => `<tr>
                    <td>${item.description ?? "-"}</td>
                    <td>${item.quantity ?? 1}</td>
                    <td>${formatEUR(Number(item.unit_price ?? 0))}</td>
                    <td>${formatEUR(Number(item.total ?? 0))}</td>
                  </tr>`,
                  )
                  .join("")
              : `<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:32px;">Aucun element</td></tr>`
          }
        </tbody>
      </table>
    </div>

    <div class="totals-wrapper">
      <div class="totals">
        <div class="total-row">
          <span>Sous-total HT</span>
          <span>${formatEUR(Number(invoice.amount ?? 0))}</span>
        </div>
        ${
          Number(invoice.discount ?? 0) > 0
            ? `
        <div class="total-row">
          <span>Remise</span>
          <span style="color:#16a34a">-${formatEUR(Number(invoice.discount))}</span>
        </div>`
            : ""
        }
        ${
          Number(invoice.tax ?? 0) > 0
            ? `
        <div class="total-row">
          <span>TVA (${invoice.tax_rate ?? 20}%)</span>
          <span>${formatEUR(Number(invoice.tax))}</span>
        </div>`
            : ""
        }
        <div class="total-row final">
          <span>Total TTC</span>
          <span>${formatEUR(Number(invoice.total ?? 0))}</span>
        </div>
      </div>
    </div>

    ${
      invoice.notes
        ? `
    <div class="notes">
      <strong>Notes :</strong> ${invoice.notes}
    </div>`
        : ""
    }

    <div class="footer">
      <div>UPSCALE — Facture generee le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</div>
      <div class="footer-legal">Paiement a 30 jours. Pas d'escompte pour paiement anticipe. Penalite de retard : 3 fois le taux d'interet legal.</div>
    </div>

    <div class="bottom-bar"></div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="facture-${invoice.invoice_number ?? id}.html"`,
    },
  });
}
