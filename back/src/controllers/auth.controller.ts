import { Request, Response } from 'express';
import { success, error } from '../utils/response.utils';

export async function register(_req: Request, res: Response) {
  // TODO: valider le body, géocoder l'adresse, créer le User, envoyer l'email de confirmation
  return success(res, { message: 'register — not implemented' }, 201);
}

export async function login(_req: Request, res: Response) {
  // TODO: vérifier email + password, retourner JWT
  return success(res, { token: null });
}

export async function verifyEmail(_req: Request, res: Response) {
  // TODO: vérifier le code reçu par email, passer isVerified à true
  return success(res, { message: 'verifyEmail — not implemented' });
}

export async function setupMfa(_req: Request, res: Response) {
  // TODO: générer secret TOTP, retourner QR code
  return success(res, { qrCode: null });
}

export async function confirmMfa(_req: Request, res: Response) {
  // TODO: activer isMfaEnabled = true sur l'utilisateur
  return success(res, { message: 'confirmMfa — not implemented' });
}
