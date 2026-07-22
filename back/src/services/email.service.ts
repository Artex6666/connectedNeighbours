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

/**
 * Envoie l'email contenant le code de confirmation d'inscription.
 * @param user Destinataire (email + prénom utilisé dans le template)
 * @param code Code à 6 chiffres à saisir pour valider le compte
 * @returns true si l'email a été accepté par le transport SMTP
 */
export function sendVerificationEmail(user: { email: string; firstName: string }, code: string) {
  const { subject, html } = tpl.verificationEmail(user.firstName, code);
  return sendMail({ to: user.email, subject, html });
}

/**
 * Prévient un habitant qu'il a reçu un nouveau message privé.
 * L'envoi est ignoré si le destinataire a désactivé la préférence « messages ».
 * @param receiver Destinataire, avec ses préférences email
 * @param senderName Nom affiché de l'expéditeur
 * @returns true si l'email a été envoyé, false s'il a été ignoré ou a échoué
 */
export function notifyNewMessage(receiver: Recipient, senderName: string) {
  if (receiver.emailPreferences?.messages === false) return Promise.resolve(false);
  const { subject, html } = tpl.newMessageEmail(receiver.firstName, senderName);
  return sendMail({ to: receiver.email, subject, html });
}

/**
 * Prévient les voisins qu'une nouvelle annonce a été publiée dans leur quartier.
 * Seuls ceux qui n'ont pas désactivé la préférence « annonces » sont contactés.
 * @param recipients Voisins candidats à la notification
 * @param service Résumé de l'annonce (titre, catégorie, payant, points)
 * @returns Nombre d'emails effectivement envoyés
 */
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

/**
 * Diffuse une newsletter à une liste de destinataires.
 * Seuls ceux qui n'ont pas désactivé la préférence « newsletter » la reçoivent.
 * @param recipients Destinataires potentiels, avec leurs préférences email
 * @param subject Sujet de la newsletter
 * @param contentHtml Corps HTML rédigé par l'administrateur
 * @returns Nombre d'emails effectivement envoyés
 */
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
