import { Request, Response } from 'express';
import Alerte from '../models/alerte.model';
import { success, error } from '../utils/response.utils';

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

export const getAlerte = async (req: Request, res: Response) => {
  try {
    const alerte = await Alerte.findById(req.params.id);
    if (!alerte) return error(res, 'Alerte introuvable', 404);
    return success(res, alerte);
  } catch {
    return error(res, 'Erreur serveur', 500);
  }
};

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

export const updateAlerte = async (req: Request, res: Response) => {
  try {
    const alerte = await Alerte.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!alerte) return error(res, 'Alerte introuvable', 404);
    return success(res, alerte);
  } catch {
    return error(res, 'Erreur lors de la mise à jour', 400);
  }
};

export const deleteAlerte = async (req: Request, res: Response) => {
  try {
    const alerte = await Alerte.findByIdAndDelete(req.params.id);
    if (!alerte) return error(res, 'Alerte introuvable', 404);
    return success(res, { message: 'Alerte supprimée' });
  } catch {
    return error(res, 'Erreur serveur', 500);
  }
};
