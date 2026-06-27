import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { success } from '../utils/response.utils';
import User from '../models/User.model';
import Token from '../models/Token.model';
import Service from '../models/Service.model';
import Event from '../models/Event.model';
import Message from '../models/Message.model';
import Vote from '../models/Vote.model';
import Incident from '../models/incident.model';

// ─── Export "Mes données" (RGPD — droit d'accès & portabilité) ────────────────────

async function collectUserData(userId: string) {
  const [user, services, events, messages, votes, incidents] = await Promise.all([
    User.findById(userId)
      .select('-password -mfaSecret -emailVerificationCode -emailVerificationExpires')
      .populate('neighborhoodId', 'name')
      .lean(),
    Service.find({ $or: [{ authorId: userId }, { accepterId: userId }] }).lean(),
    Event.find({ $or: [{ organizerId: userId }, { participants: userId }, { waitingList: userId }] }).lean(),
    Message.find({ $or: [{ senderId: userId }, { receiverId: userId }] })
      .select('senderId receiverId content type createdAt')
      .lean(),
    Vote.find({ voters: userId }).select('question type createdAt').lean(),
    Incident.find({ createdBy: userId }).lean(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: user,
    services,
    events,
    messages,
    votes,
    incidents,
  };
}

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function section(title: string, headers: string[], rows: unknown[][]): string {
  const head = `# ${title}\n${headers.join(',')}`;
  if (rows.length === 0) return `${head}\n(aucune donnée)\n`;
  const body = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  return `${head}\n${body}\n`;
}

type ExportData = Awaited<ReturnType<typeof collectUserData>>;

function toCsv(data: ExportData): string {
  const p = data.profile as Record<string, unknown> | null;
  const parts: string[] = [`Export BobConnect,${data.exportedAt}\n`];

  parts.push(
    section(
      'Profil',
      ['champ', 'valeur'],
      p
        ? [
            ['Prénom', p.firstName],
            ['Nom', p.lastName],
            ['Email', p.email],
            ['Téléphone', p.phone],
            ['Adresse', p.address],
            ['Rôle', p.role],
            ['Points', p.points],
            ['Quartier', (p.neighborhoodId as { name?: string } | undefined)?.name ?? ''],
          ]
        : [],
    ),
  );

  parts.push(
    section(
      'Services',
      ['titre', 'catégorie', 'statut', 'payant', 'points'],
      data.services.map((s) => [s.title, s.category, s.status, s.isPaid ? 'oui' : 'non', s.points]),
    ),
  );

  parts.push(
    section(
      'Événements',
      ['titre', 'date', 'lieu'],
      data.events.map((e) => [e.title, new Date(e.date).toISOString(), e.location]),
    ),
  );

  parts.push(
    section(
      'Messages',
      ['date', 'type', 'contenu'],
      data.messages.map((m) => [new Date(m.createdAt).toISOString(), m.type, m.content]),
    ),
  );

  parts.push(
    section(
      'Votes',
      ['question', 'type', 'date'],
      data.votes.map((v) => [v.question, v.type, new Date(v.createdAt).toISOString()]),
    ),
  );

  parts.push(
    section(
      'Incidents signalés',
      ['titre', 'statut', 'priorité'],
      data.incidents.map((i) => [i.title, i.status, i.priority]),
    ),
  );

  return parts.join('\n');
}

export async function exportMyData(req: Request, res: Response) {
  const userId = req.user!._id.toString();
  const data = await collectUserData(userId);
  const format = (req.query.format as string) === 'csv' ? 'csv' : 'json';

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="mes-donnees-bobconnect.csv"');
    return res.send(toCsv(data));
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="mes-donnees-bobconnect.json"');
  return res.send(JSON.stringify(data, null, 2));
}

// ─── Suppression de compte (RGPD — droit à l'effacement) ──────────────────────────
//
// On ANONYMISE plutôt qu'on supprime, pour préserver l'intégrité des données
// partagées (messages, contrats/services archivés) tout en effaçant les données
// personnelles. Le compte devient inutilisable.

export async function deleteMyAccount(req: Request, res: Response) {
  const userId = req.user!._id.toString();
  const randomPassword = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);

  await User.findByIdAndUpdate(userId, {
    $set: {
      firstName: 'Compte',
      lastName: 'supprimé',
      email: `deleted_${userId}@anonymized.local`,
      phone: '',
      address: '',
      password: randomPassword,
      isBlocked: true,
      isVerified: false,
      isMfaEnabled: false,
      emailPreferences: { messages: false, annonces: false, events: false, newsletter: false },
    },
    $unset: {
      mfaSecret: 1,
      emailVerificationCode: 1,
      emailVerificationExpires: 1,
      neighborhoodId: 1,
      lastSeenAt: 1,
    },
  });

  // Révoque toutes les sessions actives.
  await Token.deleteMany({ userId });

  return success(res, { message: 'Compte supprimé et données personnelles anonymisées.' });
}
