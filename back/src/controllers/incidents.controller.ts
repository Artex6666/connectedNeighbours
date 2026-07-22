import { Request, Response } from 'express';
import Incident from '../models/incident.model';
import { success, error } from '../utils/response.utils';

/**
 * GET /incidents — liste les incidents du plus récent au plus ancien.
 * Route réservée aux rôles admin/modérateur : un modérateur ne voit que les
 * incidents de son quartier, un admin voit tout (filtrable via ?neighborhoodId=).
 */
export const listIncidents = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const filter: Record<string, unknown> = {};

    if (user?.role === 'moderator') {
      filter.neighborhoodId = user.neighborhoodId;
    } else if (user?.role === 'admin' && req.query.neighborhoodId) {
      filter.neighborhoodId = req.query.neighborhoodId;
    }

    const incidents = await Incident.find(filter).sort({ createdAt: -1 });
    return success(res, incidents);
  } catch {
    return error(res, 'Erreur lors de la récupération des incidents', 500);
  }
};

/**
 * GET /incidents/:id — détail d'un incident.
 * Répond 404 si l'incident est introuvable, 500 en cas d'erreur serveur.
 */
export const getIncident = async (req: Request, res: Response) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return error(res, 'Incident introuvable', 404);
    return success(res, incident);
  } catch {
    return error(res, 'Erreur serveur', 500);
  }
};

/**
 * POST /incidents — signale un incident (titre, description, priorité), rattaché à
 * l'auteur et à son quartier. Répond 201, ou 400 si les données sont invalides.
 */
export const createIncident = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, description, priority } = req.body;

    const incident = await Incident.create({
      title,
      description,
      priority,
      createdBy: user?._id,
      neighborhoodId: user?.neighborhoodId,
    });

    return success(res, incident, 201);
  } catch {
    return error(res, 'Données invalides', 400);
  }
};

/**
 * PUT /incidents/:id — met à jour un incident (statut, priorité…) et renvoie la
 * version modifiée. Répond 404 si l'incident est introuvable.
 */
export const updateIncident = async (req: Request, res: Response) => {
  try {
    const incident = await Incident.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!incident) return error(res, 'Incident introuvable', 404);
    return success(res, incident);
  } catch {
    return error(res, 'Erreur lors de la mise à jour', 400);
  }
};

/**
 * DELETE /incidents/:id — supprime définitivement un incident (réservé aux admins).
 * Répond 404 si l'incident est introuvable.
 */
export const deleteIncident = async (req: Request, res: Response) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) return error(res, 'Incident introuvable', 404);
    return success(res, { message: 'Incident supprimé' });
  } catch {
    return error(res, 'Erreur serveur', 500);
  }
};
