import { sendMail } from '../utils/mailer';
import * as tpl from '../emails/templates';

/**
 * High-level, preference-aware email senders. These are the only functions the
 * controllers should call. Each is fire-and-forget friendly (never throws) and
 * honours the recipient's emailPreferences where relevant.
 */

type Recipient = {
  email: string;
  firstName: string;
  emailPreferences?: { messages?: boolean; annonces?: boolean; events?: boolean; newsletter?: boolean };
};

/** Random 6-digit confirmation code. */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function sendVerificationEmail(user: { email: string; firstName: string }, code: string) {
  const { subject, html } = tpl.verificationEmail(user.firstName, code);
  return sendMail({ to: user.email, subject, html });
}

export function notifyNewMessage(receiver: Recipient, senderName: string) {
  if (receiver.emailPreferences?.messages === false) return Promise.resolve(false);
  const { subject, html } = tpl.newMessageEmail(receiver.firstName, senderName);
  return sendMail({ to: receiver.email, subject, html });
}

export async function notifyNewService(
  recipients: Recipient[],
  service: { title: string; category: string; isPaid: boolean; points?: number },
): Promise<number> {
  const targets = recipients.filter((r) => r.emailPreferences?.annonces !== false);
  const results = await Promise.all(
    targets.map((r) => {
      const { subject, html } = tpl.newServiceEmail(r.firstName, service);
      return sendMail({ to: r.email, subject, html });
    }),
  );
  return results.filter(Boolean).length;
}

export async function sendNewsletterTo(
  recipients: Recipient[],
  subject: string,
  contentHtml: string,
): Promise<number> {
  const targets = recipients.filter((r) => r.emailPreferences?.newsletter !== false);
  const results = await Promise.all(
    targets.map((r) => {
      const built = tpl.newsletterEmail(r.firstName, subject, contentHtml);
      return sendMail({ to: r.email, subject: built.subject, html: built.html });
    }),
  );
  return results.filter(Boolean).length;
}
