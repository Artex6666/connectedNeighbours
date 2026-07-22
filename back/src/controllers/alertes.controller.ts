import { Request, Response } from 'express';
import Alerte from '../models/alerte.model';
import { success, error } from '../utils/response.utils';

/**
 * GET /alertes — liste les alertes du plus récent au plus ancien.
 * Route réservée aux rôles admin/modérateur : un modérateur ne voit que les
 * alertes de son quartier, un admin voit tout (filtrable via ?neighborhoodId=).
 */
export const listAlertes = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const filter: Record<string, unknown> = {};

    if (user?.role === 'moderator') {
      filter.neighborhoodId = user.neighborhoodId;
    } else if (user?.role === 'admin' && req.query.neighborhoodId) {
      filter.neighborhoodId = req.query.neighborhoodId;
    }

    const alertes = await Alerte.find(filter).sort({ createdAt: -1 });
    return success(res, alertes);
  } catch {
    return error(res, 'Erreur lors de la récupération des alertes', 500);
  }
};

/**
 * GET /alertes/:id — détail d'une alerte.
 * Renvoie 404 si l'alerte n'existe pas, 500 en cas d'erreur serveur.
 */
export const getAlerte = async (req: Request, res: Response) => {
  try {
    const alerte = await Alerte.findById(req.params.id);
    if (!alerte) return error(res, 'Alerte introuvable', 404);
    return success(res, alerte);
  } catch {
    return error(res, 'Erreur serveur', 500);
  }
};

/**
 * POST /alertes — crée une alerte rattachée au quartier de l'utilisateur courant.
 * Répond 201 avec l'alerte créée, 400 si les données sont invalides.
 */
export const createAlerte = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const alerte = await Alerte.create({
      ...req.body,
      neighborhoodId: user?.neighborhoodId,
    });
    return success(res, alerte, 201);
  } catch {
    return error(res, 'Données invalides', 400);
  }
};

/**
 * PUT /alertes/:id — met à jour une alerte et renvoie la version modifiée.
 * Répond 404 si l'alerte est introuvable, 400 si la mise à jour échoue.
 */
export const updateAlerte = async (req: Request, res: Response) => {
  try {
    const alerte = await Alerte.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!alerte) return error(res, 'Alerte introuvable', 404);
    return success(res, alerte);
  } catch {
    return error(res, 'Erreur lors de la mise à jour', 400);
  }
};

/**
 * DELETE /alertes/:id — supprime définitivement une alerte (réservé aux admins).
 * Répond 404 si l'alerte est introuvable.
 */
export const deleteAlerte = async (req: Request, res: Response) => {
  try {
    const alerte = await Alerte.findByIdAndDelete(req.params.id);
    if (!alerte) return error(res, 'Alerte introuvable', 404);
    return success(res, { message: 'Alerte supprimée' });
  } catch {
    return error(res, 'Erreur serveur', 500);
  }
};
