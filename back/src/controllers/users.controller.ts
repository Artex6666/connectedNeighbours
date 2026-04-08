import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { success, error } from '../utils/response.utils';
import User from '../models/User.model';

export async function getMe(req: Request, res: Response) {
  const user = await User.findById(req.user!._id).select('-password -mfaSecret');
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

export async function listUsers(_req: Request, res: Response) {
  const users = await User.find().select('-password -mfaSecret').sort({ createdAt: -1 });
  return success(res, users);
}

export async function deleteUser(req: Request, res: Response) {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return error(res, 'Utilisateur introuvable', 404);
  return success(res, { message: 'Compte supprimé' });
}
