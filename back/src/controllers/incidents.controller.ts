import { Request, Response } from 'express';
import Incident from '../models/incident.model';

export const listIncidents = async (req: Request, res: Response) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des incidents' });
  }
};

export const getIncident = async (req: Request, res: Response) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident introuvable' });
    }

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const createIncident = async (req: Request, res: Response) => {
  try {
    const { title, description, priority } = req.body;

    const incident = await Incident.create({
      title,
      description,
      priority,
      createdBy: (req as any).user?.id,
    });

    res.status(201).json(incident);
  } catch (error) {
    res.status(400).json({ message: 'Données invalides' });
  }
};

export const updateIncident = async (req: Request, res: Response) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ message: 'Incident introuvable' });
    }

    res.json(incident);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la mise à jour' });
  }
};

export const deleteIncident = async (req: Request, res: Response) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident introuvable' });
    }

    res.json({ message: 'Incident supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};