import { Request, Response } from 'express';
import { success } from '../utils/response.utils';

export async function getMe(_req: Request, res: Response) {
  // TODO: retourner req.user complet depuis la BDD
  return success(res, null);
}

export async function updateMe(_req: Request, res: Response) {
  // TODO: mettre à jour firstName, lastName, phone, address
  return success(res, null);
}

export async function getUserById(_req: Request, res: Response) {
  // TODO: retourner le profil public d'un utilisateur par ID
  return success(res, null);
}

export async function listUsers(_req: Request, res: Response) {
  // TODO: retourner la liste paginée des habitants du quartier
  return success(res, []);
}

export async function deleteUser(_req: Request, res: Response) {
  // TODO: anonymiser et supprimer le compte
  return success(res, { message: 'deleteUser — not implemented' });
}
