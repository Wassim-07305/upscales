const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://upscale.app";
const APP_NAME = process.env.RESEND_FROM_NAME || "Upscale";

function layout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0; padding:0; background-color:#0D0D0D; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0D0D; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#141414; border-radius:12px; overflow:hidden; border:1px solid #222;">
          <tr>
            <td style="padding:32px; color:#E5E7EB; font-size:15px; line-height:1.6;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px; text-align:center; color:#6B7280; font-size:12px; border-top:1px solid #222;">
              ${APP_NAME} — <a href="${APP_URL}" style="color:#C6FF00; text-decoration:none;">${APP_URL}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:#C6FF00; border-radius:8px; padding:12px 24px;">
          <a href="${url}" style="color:#0D0D0D; text-decoration:none; font-weight:bold; font-size:15px;">${text}</a>
        </td>
      </tr>
    </table>`;
}

export function welcomeEmailTemplate(firstName: string) {
  const html = layout(`
    <h1 style="color:#F9FAFB; margin-top:0;">Bienvenue, ${firstName} !</h1>
    <p>Ton compte a ete cree avec succes. Tu peux des maintenant acceder a ton tableau de bord et commencer tes formations.</p>
    ${ctaButton("Acceder au dashboard", `${APP_URL}/dashboard`)}
    <p style="color:#9CA3AF;">Si tu n'as pas cree ce compte, ignore cet email.</p>
  `);

  return {
    subject: `Bienvenue sur ${APP_NAME}, ${firstName} !`,
    html,
  };
}

export function bookingConfirmationTemplate(vars: {
  name: string;
  date: string;
  time: string;
  pageTitle: string;
}) {
  const html = layout(`
    <h1 style="color:#F9FAFB; margin-top:0;">Reservation confirmee</h1>
    <p>Bonjour ${vars.name},</p>
    <p>Votre reservation pour <strong>${vars.pageTitle}</strong> a bien ete enregistree.</p>
    <table style="width:100%; margin:16px 0; border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0; color:#9CA3AF;">Date</td>
        <td style="padding:8px 0; text-align:right; color:#F9FAFB; font-weight:bold;">${vars.date}</td>
      </tr>
      <tr>
        <td style="padding:8px 0; color:#9CA3AF;">Heure</td>
        <td style="padding:8px 0; text-align:right; color:#F9FAFB;">${vars.time}</td>
      </tr>
    </table>
    ${ctaButton("Voir mes reservations", `${APP_URL}/dashboard`)}
  `);

  return {
    subject: `Reservation confirmee — ${vars.pageTitle}`,
    html,
  };
}

export function certificateEarnedTemplate(vars: {
  name: string;
  formationTitle: string;
  certificateNumber: string;
}) {
  const html = layout(`
    <h1 style="color:#F9FAFB; margin-top:0;">Felicitations, ${vars.name} !</h1>
    <p>Vous avez obtenu votre certificat pour la formation <strong>${vars.formationTitle}</strong>.</p>
    <p style="color:#9CA3AF;">Numero de certificat : <strong style="color:#C6FF00;">${vars.certificateNumber}</strong></p>
    ${ctaButton("Voir mon certificat", `${APP_URL}/certificates`)}
  `);

  return {
    subject: `Certificat obtenu — ${vars.formationTitle}`,
    html,
  };
}

export function notificationDigestTemplate(
  notifications: { title: string; body: string }[]
) {
  const items = notifications
    .map(
      (n) => `
      <tr>
        <td style="padding:12px; border-bottom:1px solid #222;">
          <strong style="color:#F9FAFB;">${n.title}</strong>
          <p style="color:#9CA3AF; margin:4px 0 0;">${n.body}</p>
        </td>
      </tr>`
    )
    .join("");

  const html = layout(`
    <h1 style="color:#F9FAFB; margin-top:0;">Vos notifications</h1>
    <p>Vous avez ${notifications.length} notification(s) non lue(s) :</p>
    <table style="width:100%; border-collapse:collapse; margin:16px 0;">
      ${items}
    </table>
    ${ctaButton("Voir toutes mes notifications", `${APP_URL}/notifications`)}
  `);

  return {
    subject: `${notifications.length} notification(s) non lue(s)`,
    html,
  };
}
