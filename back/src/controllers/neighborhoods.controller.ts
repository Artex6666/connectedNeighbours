import { Request, Response } from 'express';
import { success } from '../utils/response.utils';

export async function listNeighborhoods(_req: Request, res: Response) {
  // TODO: retourner tous les quartiers (avec polygones GeoJSON)
  return success(res, []);
}

export async function getNeighborhood(_req: Request, res: Response) {
  // TODO: retourner un quartier par ID
  return success(res, null);
}

export async function createNeighborhood(_req: Request, res: Response) {
  // TODO: valider le polygone (pas de chevauchement), créer le quartier
  return success(res, null, 201);
}

export async function updateNeighborhood(_req: Request, res: Response) {
  // TODO: modifier le polygone, notifier les habitants hors-zone
  return success(res, null);
}

export async function deleteNeighborhood(_req: Request, res: Response) {
  // TODO: vérifier qu'aucun habitant n'est rattaché avant de supprimer
  return success(res, { message: 'deleteNeighborhood — not implemented' });
}
