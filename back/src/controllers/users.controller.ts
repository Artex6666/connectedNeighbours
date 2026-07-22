import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { success, error } from '../utils/response.utils';
import { isOnline } from '../utils/presence';
import { signAccessToken } from '../utils/jwt.utils';
import User from '../models/User.model';
import Token from '../models/Token.model';
import Neighborhood from '../models/Neighborhood.model';

const EMAIL_PREF_KEYS = ['messages', 'annonces', 'events', 'newsletter'] as const;

/**
 * GET /users/me — profil complet de l'utilisateur connecté (sans mot de passe ni
 * secret 2FA), avec son quartier. Répond 404 si le compte n'existe plus.
 */
export async function getMe(req: Request, res: Response) {
  const user = await User.findById(req.user!._id)
    .select('-password -mfaSecret')
    .populate('neighborhoodId', 'name description polygon');
  if (!user) return error(res, 'Utilisateur introuvable', 404);
  return success(res, user);
}

/**
 * PUT /users/me — met à jour son propre profil. Seuls firstName, lastName, phone et
 * address sont modifiables ; un `password` fourni est re-haché en bcrypt.
 */
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

/**
 * GET /users/:id — profil public d'un autre habitant (sans mot de passe ni secret 2FA).
 * Répond 404 si l'utilisateur est introuvable.
 */
export async function getUserById(req: Request, res: Response) {
  const user = await User.findById(req.params.id).select('-password -mfaSecret');
  if (!user) return error(res, 'Utilisateur introuvable', 404);
  return success(res, user);
}

/**
 * GET /users/neighbors — liste les autres habitants du quartier de l'utilisateur,
 * triés par prénom/nom, avec leur statut de présence (`isOnline`).
 */
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

/**
 * PUT /users/me/preferences — met à jour les préférences de notification email
 * (messages, annonces, events, newsletter). Seules les valeurs booléennes sont
 * prises en compte ; répond 400 si aucune préférence valide n'est fournie.
 */
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

/**
 * POST /users/heartbeat — signal de présence envoyé périodiquement par le front :
 * rafraîchit `lastSeenAt`, ce qui alimente le statut « en ligne » et la règle
 * « email uniquement si le destinataire est hors ligne ».
 */
export async function heartbeat(req: Request, res: Response) {
  await User.findByIdAndUpdate(req.user!._id, { lastSeenAt: new Date() });
  return success(res, { ok: true });
}

// ─── Rejoindre un quartier (self-service) ─────────────────────────────────────────

/**
 * PUT /users/me/neighborhood — rejoindre un quartier, ou le quitter si `neighborhoodId`
 * est null/vide. Le quartier étant encodé dans le JWT (filtrage annonces/votes/events),
 * un nouvel access token est renvoyé pour que le changement s'applique sans re-login.
 * Répond 404 si le quartier demandé n'existe pas.
 */
export async function setMyNeighborhood(req: Request, res: Response) {
  const { neighborhoodId } = req.body as { neighborhoodId?: string | null };
  const leaving = neighborhoodId === null || neighborhoodId === '';

  if (!leaving) {
    const hood = await Neighborhood.findById(neighborhoodId).select('_id');
    if (!hood) return error(res, 'Quartier introuvable', 404);
  }

  const update = leaving ? { $unset: { neighborhoodId: 1 } } : { neighborhoodId };
  const user = await User.findByIdAndUpdate(req.user!._id, update, { new: true })
    .select('-password -mfaSecret')
    .populate('neighborhoodId', 'name description polygon');
  if (!user) return error(res, 'Utilisateur introuvable', 404);

  // Le neighborhoodId est encodé dans le JWT (scoping annonces/votes/events…).
  // On renvoie un token frais pour que le changement soit pris en compte
  // immédiatement, sans re-login.
  const accessToken = signAccessToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    neighborhoodId: leaving ? undefined : (neighborhoodId as string),
  });

  return success(res, { user, accessToken });
}

/**
 * GET /users — liste tous les comptes, les plus récents d'abord (admin/modérateur).
 */
export async function listUsers(_req: Request, res: Response) {
  const users = await User.find().select('-password -mfaSecret').sort({ createdAt: -1 });
  return success(res, users);
}

/**
 * DELETE /users/:id — supprime définitivement un compte (admin uniquement).
 * Répond 404 si l'utilisateur est introuvable.
 */
export async function deleteUser(req: Request, res: Response) {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return error(res, 'Utilisateur introuvable', 404);
  return success(res, { message: 'Compte supprimé' });
}

const ALLOWED_ROLES = ['resident', 'moderator', 'admin'] as const;

/**
 * PUT /users/:id/role — change le rôle d'un compte (admin uniquement).
 * Le rôle doit être resident, moderator ou admin, et un admin ne peut pas se
 * rétrograder lui-même (400 dans les deux cas).
 */
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

/**
 * PUT /users/:id/neighborhood — rattache un habitant à un quartier, ou l'en détache si
 * `neighborhoodId` est null/vide (admin uniquement). Répond 404 si le compte est introuvable.
 */
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

/**
 * PUT /users/:id/block — bloque ou débloque un compte (admin/modérateur).
 * Le champ booléen `blocked` est obligatoire et l'on ne peut pas se bloquer soi-même (400).
 * Un blocage révoque également toutes les sessions actives du compte.
 */
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
