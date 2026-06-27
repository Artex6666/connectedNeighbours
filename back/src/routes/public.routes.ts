import { Router } from 'express';
import * as publicController from '../controllers/public.controller';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Public
 *   description: Endpoints publics (sans authentification) pour la vitrine
 */

/**
 * @swagger
 * /public/stats:
 *   get:
 *     summary: Chiffres clés de la plateforme (public)
 *     tags: [Public]
 *     responses:
 *       200: { description: "{ neighborhoods, residents, services, events, votes }" }
 */
router.get('/stats', publicController.publicStats);

/**
 * @swagger
 * /public/neighborhoods:
 *   get:
 *     summary: Quartiers et leurs polygones (public, pour la carte)
 *     tags: [Public]
 *     responses:
 *       200: { description: Liste des quartiers }
 */
router.get('/neighborhoods', publicController.publicNeighborhoods);

/**
 * @swagger
 * /public/services:
 *   get:
 *     summary: Annonces récentes (public, lecture seule)
 *     tags: [Public]
 *     responses:
 *       200: { description: Jusqu'à 12 annonces récentes }
 */
router.get('/services', publicController.publicServices);

/**
 * @swagger
 * /public/votes:
 *   get:
 *     summary: Sondages à la une (public, lecture seule)
 *     tags: [Public]
 *     responses:
 *       200: { description: Jusqu'à 8 sondages récents avec résultats }
 */
router.get('/votes', publicController.publicVotes);

/**
 * @swagger
 * /public/events:
 *   get:
 *     summary: Événements à venir (public, lecture seule)
 *     tags: [Public]
 *     responses:
 *       200: { description: Jusqu'à 8 événements à venir }
 */
router.get('/events', publicController.publicEvents);

export default router;
