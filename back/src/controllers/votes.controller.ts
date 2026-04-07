import { Request, Response } from 'express';
import { success } from '../utils/response.utils';

export async function listVotes(_req: Request, res: Response) {
  // TODO: lister les votes du quartier (ouverts et fermés)
  return success(res, []);
}

export async function getVote(_req: Request, res: Response) {
  // TODO: retourner un vote par ID (avec résultats si autorisé)
  return success(res, null);
}

export async function createVote(_req: Request, res: Response) {
  // TODO: créer un vote avec ses options et paramètres
  return success(res, null, 201);
}

export async function castVote(_req: Request, res: Response) {
  // TODO: enregistrer le vote de l'utilisateur (vérifier quorum, doublon, clôture)
  return success(res, null);
}

export async function deleteVote(_req: Request, res: Response) {
  // TODO: supprimer un vote (auteur ou admin, si pas encore ouvert)
  return success(res, { message: 'deleteVote — not implemented' });
}
