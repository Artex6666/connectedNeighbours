import { Request, Response } from 'express';
import { success } from '../utils/response.utils';

export async function listDocuments(_req: Request, res: Response) {
  // TODO: retourner les documents où l'utilisateur est importateur ou signataire
  return success(res, []);
}

export async function getDocument(_req: Request, res: Response) {
  // TODO: retourner un document par ID (vérifier les droits d'accès)
  return success(res, null);
}

export async function uploadDocument(_req: Request, res: Response) {
  // TODO: recevoir le fichier PDF, calculer le hash, stocker l'URL
  return success(res, null, 201);
}

export async function sendForSignature(_req: Request, res: Response) {
  // TODO: définir les signataires et l'ordre, notifier par email et in-app
  return success(res, null);
}

export async function signDocument(_req: Request, res: Response) {
  // TODO: apposer la signature (horodatée, chiffrée), verrouiller si tous ont signé
  return success(res, null);
}

export async function verifyDocument(_req: Request, res: Response) {
  // TODO: recalculer le hash et comparer pour vérifier l'intégrité
  return success(res, { valid: null });
}
