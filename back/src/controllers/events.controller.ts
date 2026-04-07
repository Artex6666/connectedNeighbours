import { Request, Response } from 'express';
import { success } from '../utils/response.utils';

export async function listEvents(_req: Request, res: Response) {
  // TODO: lister les événements du quartier (avec suggestions Neo4j)
  return success(res, []);
}

export async function getEvent(_req: Request, res: Response) {
  // TODO: retourner un événement par ID
  return success(res, null);
}

export async function createEvent(_req: Request, res: Response) {
  // TODO: créer un événement
  return success(res, null, 201);
}

export async function updateEvent(_req: Request, res: Response) {
  // TODO: modifier un événement (organisateur uniquement)
  return success(res, null);
}

export async function deleteEvent(_req: Request, res: Response) {
  // TODO: annuler l'événement, notifier les inscrits
  return success(res, { message: 'deleteEvent — not implemented' });
}

export async function registerToEvent(_req: Request, res: Response) {
  // TODO: inscrire l'utilisateur (ou liste d'attente si complet)
  return success(res, null);
}

export async function unregisterFromEvent(_req: Request, res: Response) {
  // TODO: désinscrire l'utilisateur, promouvoir le suivant en liste d'attente
  return success(res, null);
}
