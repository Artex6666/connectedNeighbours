import { Request, Response } from 'express';
import Alerte from '../models/alerte.model';

export const listAlertes = async (req: Request, res: Response) => {
  try {
    const alertes = await Alerte.find().sort({ createdAt: -1 });
    res.json(alertes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des alertes' });
  }
};

export const getAlerte = async (req: Request, res: Response) => {
  try {
    const alerte = await Alerte.findById(req.params.id);

    if (!alerte) {
      return res.status(404).json({ message: 'Alerte introuvable' });
    }

    res.json(alerte);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const createAlerte = async (req: Request, res: Response) => {
  try {
    const alerte = await Alerte.create(req.body);
    res.status(201).json(alerte);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides' });
  }
};

export const updateAlerte = async (req: Request, res: Response) => {
  try {
    const alerte = await Alerte.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!alerte) {
      return res.status(404).json({ message: 'Alerte introuvable' });
    }

    res.json(alerte);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la mise à jour' });
  }
};

export const deleteAlerte = async (req: Request, res: Response) => {
  try {
    const alerte = await Alerte.findByIdAndDelete(req.params.id);

    if (!alerte) {
      return res.status(404).json({ message: 'Alerte introuvable' });
    }

    res.json({ message: 'Alerte supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};