import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { success, error } from '../utils/response.utils';
import { isOnline } from '../utils/presence';
import User from '../models/User.model';
import Token from '../models/Token.model';

const EMAIL_PREF_KEYS = ['messages', 'annonces', 'events', 'newsletter'] as const;

export async function getMe(req: Request, res: Response) {
  const user = await User.findById(req.user!._id)
    .select('-password -mfaSecret')
    .populate('neighborhoodId', 'name description polygon');
  if (!user) return error(res, 'Utilisateur introuvable', 404);
  return success(res, user);
}

export async function updateMe(req: Request, res: Response) {
  const allowed = ['firstName', 'lastName', 'phone', 'address'];
  const updates: Record<string, string> = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (req.body.password) {
    updates['password'] = await bcrypt.hash(req.body.password, 10);
  }

  const user = await User.findByIdAndUpdate(req.user!._id, updates, { new: true }).select('-password -mfaSecret');
  if (!user) return error(res, 'Utilisateur introuvable', 404);
  return success(res, user);
}

export async function getUserById(req: Request, res: Response) {
  const user = await User.findById(req.params.id).select('-password -mfaSecret');
  if (!user) return error(res, 'Utilisateur introuvable', 404);
  return success(res, user);
}

export async function listMyNeighbors(req: Request, res: Response) {
  const neighborhoodId = req.user?.neighborhoodId;
  const filter: Record<string, unknown> = { _id: { $ne: req.user!._id } };
  if (neighborhoodId) filter.neighborhoodId = neighborhoodId;
  const users = await User.find(filter)
    .select('firstName lastName role neighborhoodId lastSeenAt')
    .sort({ firstName: 1, lastName: 1 })
    .lean();
  const withPresence = users.map((u) => ({ ...u, isOnline: isOnline(u.lastSeenAt) }));
  return success(res, withPresence);
}

// ─── Préférences de notification email ──────────────────────────────────────────

export async function updateMyPreferences(req: Request, res: Response) {
  const updates: Record<string, boolean> = {};
  for (const key of EMAIL_PREF_KEYS) {
    if (typeof req.body[key] === 'boolean') {
      updates[`emailPreferences.${key}`] = req.body[key];
    }
  }
  if (Object.keys(updates).length === 0) {
    return error(res, 'Aucune préférence valide fournie', 400);
  }
  const user = await User.findByIdAndUpdate(req.user!._id, { $set: updates }, { new: true }).select(
    'emailPreferences',
  );
  if (!user) return error(res, 'Utilisateur introuvable', 404);
  return success(res, user.emailPreferences);
}

// ─── Présence (heartbeat) ────────────────────────────────────────────────────────

export async function heartbeat(req: Request, res: Response) {
  await User.findByIdAndUpdate(req.user!._id, { lastSeenAt: new Date() });
  return success(res, { ok: true });
}

export async function listUsers(_req: Request, res: Response) {
  const users = await User.find().select('-password -mfaSecret').sort({ createdAt: -1 });
  return success(res, users);
}

export async function deleteUser(req: Request, res: Response) {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return error(res, 'Utilisateur introuvable', 404);
  return success(res, { message: 'Compte supprimé' });
}

const ALLOWED_ROLES = ['resident', 'moderator', 'admin'] as const;

export async function updateUserRole(req: Request, res: Response) {
  const { role } = req.body as { role?: string };
  if (!role || !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return error(res, `role doit être l'une de : ${ALLOWED_ROLES.join(', ')}`, 400);
  }
  if (req.params.id === req.user!._id.toString() && role !== 'admin') {
    return error(res, 'Un admin ne peut pas se rétrograder lui-même', 400);
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select(
    '-password -mfaSecret',
  );
  if (!user) return error(res, 'Utilisateur introuvable', 404);
  return success(res, user);
}

export async function updateUserNeighborhood(req: Request, res: Response) {
  const { neighborhoodId } = req.body as { neighborhoodId?: string | null };
  const update =
    neighborhoodId === null || neighborhoodId === ''
      ? { $unset: { neighborhoodId: 1 } }
      : { neighborhoodId };
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select(
    '-password -mfaSecret',
  );
  if (!user) return error(res, 'Utilisateur introuvable', 404);
  return success(res, user);
}

// ─── Blocage de compte (admin/modérateur) ───────────────────────────────────────

export async function setUserBlocked(req: Request, res: Response) {
  const { blocked } = req.body as { blocked?: boolean };
  if (typeof blocked !== 'boolean') {
    return error(res, 'Le champ "blocked" (booléen) est requis', 400);
  }
  if (req.params.id === req.user!._id.toString()) {
    return error(res, 'Vous ne pouvez pas bloquer votre propre compte', 400);
  }
  const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: blocked }, { new: true }).select(
    '-password -mfaSecret',
  );
  if (!user) return error(res, 'Utilisateur introuvable', 404);

  // Bloquer = révoquer toutes les sessions actives
  if (blocked) {
    await Token.deleteMany({ userId: user._id });
  }
  return success(res, user);
}
