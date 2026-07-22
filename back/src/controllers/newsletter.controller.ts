import { Request, Response } from 'express';
import { success, error } from '../utils/response.utils';
import { sendNewsletterTo } from '../services/email.service';
import Newsletter, { INewsletter } from '../models/Newsletter.model';
import User from '../models/User.model';

// ─── Envoi effectif (réutilisé par "envoyer maintenant" et le scheduler) ─────────

async function dispatchNewsletter(newsletter: INewsletter): Promise<number> {
  const recipients = await User.find({ isBlocked: { $ne: true } })
    .select('email firstName emailPreferences')
    .lean();

  const count = await sendNewsletterTo(recipients, newsletter.subject, newsletter.contentHtml);

  newsletter.status = 'sent';
  newsletter.sentAt = new Date();
  newsletter.sentCount = count;
  newsletter.scheduledAt = undefined;
  await newsletter.save();
  return count;
}

/**
 * Called periodically by the server scheduler: send every scheduled newsletter
 * whose time has come. Safe to call when nothing is due.
 */
export async function processDueNewsletters(): Promise<void> {
  const due = await Newsletter.find({ status: 'scheduled', scheduledAt: { $lte: new Date() } });
  for (const newsletter of due) {
    try {
      const count = await dispatchNewsletter(newsletter);
      console.log(`[newsletter] "${newsletter.subject}" envoyée à ${count} destinataire(s).`);
    } catch (err) {
      console.error('[newsletter] échec envoi planifié:', (err as Error).message);
    }
  }
}

// ─── CRUD ────────────────────────────────────────────────────────────────────────

/**
 * GET /newsletter — liste toutes les newsletters (brouillons, planifiées, envoyées),
 * les plus récentes d'abord. Réservé aux rôles admin/modérateur.
 */
export async function listNewsletters(_req: Request, res: Response) {
  const newsletters = await Newsletter.find()
    .sort({ createdAt: -1 })
    .populate('authorId', 'firstName lastName');
  return success(res, newsletters);
}

/**
 * GET /newsletter/:id — détail d'une newsletter et de son auteur.
 * Répond 404 si elle est introuvable.
 */
export async function getNewsletter(req: Request, res: Response) {
  const newsletter = await Newsletter.findById(req.params.id).populate(
    'authorId',
    'firstName lastName',
  );
  if (!newsletter) return error(res, 'Newsletter introuvable', 404);
  return success(res, newsletter);
}

/**
 * POST /newsletter — crée une newsletter, au statut « scheduled » si `scheduledAt`
 * est fourni, sinon « draft ». Répond 400 si le sujet est vide ou la date invalide.
 */
export async function createNewsletter(req: Request, res: Response) {
  const { subject, contentHtml, scheduledAt } = req.body as {
    subject?: string;
    contentHtml?: string;
    scheduledAt?: string;
  };
  if (!subject || !subject.trim()) return error(res, 'Le sujet est requis', 400);

  const scheduled = scheduledAt ? new Date(scheduledAt) : undefined;
  if (scheduled && Number.isNaN(scheduled.getTime())) {
    return error(res, 'scheduledAt invalide', 400);
  }

  const newsletter = await Newsletter.create({
    subject: subject.trim(),
    contentHtml: contentHtml ?? '',
    status: scheduled ? 'scheduled' : 'draft',
    scheduledAt: scheduled,
    authorId: req.user!._id,
  });
  return success(res, newsletter, 201);
}

/**
 * PUT /newsletter/:id — modifie une newsletter non encore envoyée.
 * Vider `scheduledAt` la repasse en brouillon, le renseigner la planifie.
 * Répond 404 si introuvable, 400 si déjà envoyée ou si la date est invalide.
 */
export async function updateNewsletter(req: Request, res: Response) {
  const newsletter = await Newsletter.findById(req.params.id);
  if (!newsletter) return error(res, 'Newsletter introuvable', 404);
  if (newsletter.status === 'sent') {
    return error(res, 'Une newsletter déjà envoyée ne peut plus être modifiée', 400);
  }

  const { subject, contentHtml, scheduledAt } = req.body as {
    subject?: string;
    contentHtml?: string;
    scheduledAt?: string | null;
  };

  if (subject !== undefined) newsletter.subject = subject.trim();
  if (contentHtml !== undefined) newsletter.contentHtml = contentHtml;
  if (scheduledAt !== undefined) {
    if (scheduledAt === null || scheduledAt === '') {
      newsletter.scheduledAt = undefined;
      newsletter.status = 'draft';
    } else {
      const date = new Date(scheduledAt);
      if (Number.isNaN(date.getTime())) return error(res, 'scheduledAt invalide', 400);
      newsletter.scheduledAt = date;
      newsletter.status = 'scheduled';
    }
  }

  await newsletter.save();
  return success(res, newsletter);
}

/**
 * DELETE /newsletter/:id — supprime une newsletter. Répond 404 si elle est introuvable.
 */
export async function deleteNewsletter(req: Request, res: Response) {
  const deleted = await Newsletter.findByIdAndDelete(req.params.id);
  if (!deleted) return error(res, 'Newsletter introuvable', 404);
  return success(res, { message: 'Newsletter supprimée' });
}

/** Envoyer immédiatement (admin/modérateur). */
export async function sendNewsletter(req: Request, res: Response) {
  const newsletter = await Newsletter.findById(req.params.id);
  if (!newsletter) return error(res, 'Newsletter introuvable', 404);
  if (newsletter.status === 'sent') {
    return error(res, 'Newsletter déjà envoyée', 400);
  }

  const count = await dispatchNewsletter(newsletter);
  return success(res, { message: `Newsletter envoyée à ${count} destinataire(s)`, sentCount: count, newsletter });
}
