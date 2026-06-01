import { Request, Response } from 'express';
import Incident from '../models/incident.model';
import Alerte from '../models/alerte.model';

export const dashboard = async (_req: Request, res: Response) => {
  try {
    const totalIncidents = await Incident.countDocuments();
    const incidentsOuverts = await Incident.countDocuments({ status: 'open' });
    const incidentsEnCours = await Incident.countDocuments({ status: 'in_progress' });
    const incidentsResolus = await Incident.countDocuments({ status: 'resolved' });

    const totalAlertes = await Alerte.countDocuments();
    const alertesActives = await Alerte.countDocuments({ active: true });

    return res.json({
      incidents: {
        total: totalIncidents,
        ouverts: incidentsOuverts,
        enCours: incidentsEnCours,
        resolus: incidentsResolus,
      },
      alertes: {
        total: totalAlertes,
        actives: alertesActives,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Erreur lors du chargement des statistiques',
    });
  }
};