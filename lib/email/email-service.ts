import {
  welcomeEmailTemplate,
  bookingConfirmationTemplate,
  certificateEarnedTemplate,
  notificationDigestTemplate,
} from "./email-templates";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

const DEFAULT_FROM = `${process.env.RESEND_FROM_NAME || "Upscale"} <${process.env.RESEND_FROM_EMAIL || "noreply@example.com"}>`;

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const from = payload.from ?? DEFAULT_FROM;
  const apiKey = process.env.RESEND_API_KEY;

  // Mode developpement — pas de cle API
  if (!apiKey) {
    const devId = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log("──────────────────────────────────────────");
    console.log("[EMAIL] Mode developpement (pas de RESEND_API_KEY)");
    console.log(`  From   : ${from}`);
    console.log(`  To     : ${payload.to}`);
    console.log(`  Subject: ${payload.subject}`);
    console.log("──────────────────────────────────────────");
    return { success: true, id: devId };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[EMAIL] Erreur API Resend:", response.status, errorBody);
      return { success: false, error: `Resend API error (${response.status})` };
    }

    const data: { id: string } = await response.json();
    return { success: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[EMAIL] Echec d'envoi:", message);
    return { success: false, error: message };
  }
}

export async function sendWelcomeEmail(to: string, firstName: string): Promise<EmailResult> {
  const { subject, html } = welcomeEmailTemplate(firstName);
  return sendEmail({ to, subject, html });
}

export async function sendBookingConfirmation(
  to: string,
  vars: { name: string; date: string; time: string; pageTitle: string }
): Promise<EmailResult> {
  const { subject, html } = bookingConfirmationTemplate(vars);
  return sendEmail({ to, subject, html });
}

export async function sendCertificateEarned(
  to: string,
  vars: { name: string; formationTitle: string; certificateNumber: string }
): Promise<EmailResult> {
  const { subject, html } = certificateEarnedTemplate(vars);
  return sendEmail({ to, subject, html });
}

export async function sendNotificationDigest(
  to: string,
  notifications: { title: string; body: string }[]
): Promise<EmailResult> {
  const { subject, html } = notificationDigestTemplate(notifications);
  return sendEmail({ to, subject, html });
}
