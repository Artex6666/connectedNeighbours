import { appUrl } from '../utils/mailer';

/**
 * Email HTML builders. Styles are inlined because most mail clients strip
 * <style> blocks. Each builder returns { subject, html } ready for sendMail().
 */

const BRAND = '#2563eb';
const BG = '#f1f5f9';
const CARD = '#ffffff';
const TEXT = '#0f172a';
const MUTED = '#64748b';

interface LayoutOptions {
  title: string;
  intro?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}

function layout({ title, intro, bodyHtml, ctaLabel, ctaUrl, footerNote }: LayoutOptions): string {
  const cta =
    ctaLabel && ctaUrl
      ? `<tr><td style="padding:8px 0 4px;">
           <a href="${ctaUrl}" style="display:inline-block;background:${BRAND};color:#fff;
             text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;">
             ${ctaLabel}</a>
         </td></tr>`
      : '';

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${TEXT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${CARD};border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr><td style="background:${BRAND};padding:20px 28px;">
          <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:.3px;">BobConnect</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:${TEXT};">${title}</h1>
          ${intro ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${MUTED};">${intro}</p>` : ''}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:15px;line-height:1.6;color:${TEXT};">${bodyHtml}</td></tr>
            ${cta}
          </table>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;line-height:1.5;color:${MUTED};">
            ${footerNote ?? 'Vous recevez cet email car vous avez un compte sur BobConnect, la plateforme de votre quartier.'}
          </p>
        </td></tr>
      </table>
      <p style="max-width:560px;margin:14px auto 0;font-size:11px;color:${MUTED};text-align:center;">
        © BobConnect — Plateforme collaborative de quartier
      </p>
    </td></tr>
  </table>
</body></html>`;
}

// ─── Vérification de compte ─────────────────────────────────────────────────────
export function verificationEmail(firstName: string, code: string) {
  return {
    subject: 'Confirmez votre compte BobConnect',
    html: layout({
      title: `Bienvenue ${firstName} 👋`,
      intro: 'Pour activer votre compte, saisissez ce code de confirmation dans l\'application :',
      bodyHtml: `<div style="text-align:center;margin:8px 0 4px;">
          <span style="display:inline-block;font-size:32px;font-weight:800;letter-spacing:8px;
            background:${BG};padding:14px 22px;border-radius:10px;color:${BRAND};">${code}</span>
        </div>
        <p style="margin:16px 0 0;font-size:13px;color:${MUTED};">Ce code expire dans 30 minutes. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>`,
      footerNote: 'Email automatique de vérification — merci de ne pas y répondre.',
    }),
  };
}

// ─── Nouveau message ────────────────────────────────────────────────────────────
export function newMessageEmail(recipientName: string, senderName: string) {
  return {
    subject: `💬 Nouveau message de ${senderName}`,
    html: layout({
      title: `Vous avez un nouveau message`,
      intro: `Bonjour ${recipientName}, ${senderName} vous a écrit sur BobConnect.`,
      bodyHtml: `<p style="margin:0;">Connectez-vous pour lire le message et répondre.</p>`,
      ctaLabel: 'Voir la conversation',
      ctaUrl: appUrl('/dashboard'),
      footerNote: 'Vous recevez cet email car les notifications de messages sont activées dans vos préférences. Vous pouvez les désactiver dans Paramètres → Notifications.',
    }),
  };
}

// ─── Nouvelle annonce dans le quartier ──────────────────────────────────────────
export function newServiceEmail(
  recipientName: string,
  service: { title: string; category: string; isPaid: boolean; points?: number },
) {
  const price = service.isPaid ? `${service.points ?? 0} points` : 'Gratuit';
  return {
    subject: `📣 Nouvelle annonce dans votre quartier : ${service.title}`,
    html: layout({
      title: service.title,
      intro: `Bonjour ${recipientName}, une nouvelle annonce vient d'être publiée dans votre quartier.`,
      bodyHtml: `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;">
          <tr><td style="color:${MUTED};padding:2px 12px 2px 0;">Catégorie</td><td style="font-weight:600;">${service.category}</td></tr>
          <tr><td style="color:${MUTED};padding:2px 12px 2px 0;">Tarif</td><td style="font-weight:600;">${price}</td></tr>
        </table>`,
      ctaLabel: 'Voir l\'annonce',
      ctaUrl: appUrl('/services'),
      footerNote: 'Vous recevez cet email car les notifications d\'annonces sont activées dans vos préférences.',
    }),
  };
}

// ─── Newsletter ─────────────────────────────────────────────────────────────────
export function newsletterEmail(recipientName: string, subject: string, contentHtml: string) {
  return {
    subject,
    html: layout({
      title: subject,
      intro: `Bonjour ${recipientName},`,
      bodyHtml: contentHtml,
      ctaLabel: 'Ouvrir BobConnect',
      ctaUrl: appUrl('/'),
      footerNote: 'Vous recevez la newsletter BobConnect. Désabonnez-vous dans Paramètres → Notifications → Newsletter.',
    }),
  };
}
