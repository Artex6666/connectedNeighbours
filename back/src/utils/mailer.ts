import nodemailer, { Transporter } from 'nodemailer';

/**
 * Low-level mail transport.
 *
 * Configured from SMTP_* env vars (Brevo relay in production). When SMTP_HOST is
 * absent the transport is a no-op: sendMail() simply returns false and logs once,
 * so the app keeps working in dev/test/CI without any SMTP server. This is also
 * what lets seeded/fake accounts work — nothing is ever actually delivered.
 */
let transporter: Transporter | null = null;
let initialized = false;

function getTransporter(): Transporter | null {
  if (initialized) return transporter;
  initialized = true;

  const host = process.env.SMTP_HOST;
  if (!host) {
    console.warn('[mailer] SMTP_HOST non défini — envoi d\'emails désactivé (no-op).');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false, // port 587 → STARTTLS
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  return transporter;
}

/**
 * Indique si l'envoi d'emails est actif sur ce serveur, c'est-à-dire si la
 * variable d'environnement SMTP_HOST est définie.
 * @returns true si un serveur SMTP est configuré
 */
export function isMailEnabled(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

/** Public base URL of the web app, used to build links inside emails. */
export function appUrl(path = ''): string {
  const base = (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');
  return path ? `${base}${path.startsWith('/') ? path : `/${path}`}` : base;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface MailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send one email. Never throws — returns true on success, false otherwise, so
 * callers can fire-and-forget without breaking the request flow.
 */
export async function sendMail(input: MailInput): Promise<boolean> {
  const tx = getTransporter();
  if (!tx) return false;

  const fromName = process.env.MAIL_FROM_NAME ?? 'BobConnect';
  const fromEmail = process.env.MAIL_FROM ?? 'no-reply@localhost';

  try {
    await tx.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: Array.isArray(input.to) ? input.to.join(',') : input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? stripHtml(input.html),
    });
    return true;
  } catch (err) {
    console.error('[mailer] échec envoi:', (err as Error).message);
    return false;
  }
}
