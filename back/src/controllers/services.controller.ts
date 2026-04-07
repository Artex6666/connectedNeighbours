import { Request, Response } from 'express';
import { success } from '../utils/response.utils';

export async function listServices(_req: Request, res: Response) {
  // TODO: lister les annonces du quartier de l'utilisateur
  return success(res, []);
}

export async function getService(_req: Request, res: Response) {
  // TODO: retourner une annonce par ID
  return success(res, null);
}

export async function createService(_req: Request, res: Response) {
  // TODO: créer une annonce (gratuit ou payant)
  return success(res, null, 201);
}

export async function updateService(_req: Request, res: Response) {
  // TODO: modifier une annonce (auteur uniquement, si statut = open)
  return success(res, null);
}

export async function deleteService(_req: Request, res: Response) {
  // TODO: supprimer une annonce
  return success(res, { message: 'deleteService — not implemented' });
}

export async function acceptService(_req: Request, res: Response) {
  // TODO: bloquer les points du demandeur, générer le contrat PDF, passer statut à in_progress
  return success(res, null);
}

export async function completeService(_req: Request, res: Response) {
  // TODO: transférer les points à l'offreur, passer statut à done
  return success(res, null);
}
