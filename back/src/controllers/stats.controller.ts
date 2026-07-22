import { Request, Response } from 'express';
import Incident from '../models/incident.model';
import Alerte from '../models/alerte.model';

/**
 * GET /stats/dashboard — indicateurs du tableau de bord (admin/modérateur) :
 * nombre total d'incidents et leur répartition par statut (ouverts, en cours,
 * résolus), plus le total d'alertes et le nombre d'alertes actives.
 * Répond 500 en cas d'erreur de chargement.
 */
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