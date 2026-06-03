import { Router } from 'express';
import * as incidentsController from '../controllers/incidents.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router: Router = Router();

router.use(authMiddleware);
router.use(requireRole('admin', 'moderator'));

/**
 * @swagger
 * /incidents:
 *   get:
 *     summary: Liste les incidents
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste des incidents
 */
router.get('/', incidentsController.listIncidents);

/**
 * @swagger
 * /incidents/{id}:
 *   get:
 *     summary: Détail d'un incident
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Incident trouvé
 *       404:
 *         description: Incident introuvable
 */
router.get('/:id', incidentsController.getIncident);

/**
 * @swagger
 * /incidents:
 *   post:
 *     summary: Crée un incident
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       201:
 *         description: Incident créé
 */
router.post('/', incidentsController.createIncident);

/**
 * @swagger
 * /incidents/{id}:
 *   put:
 *     summary: Met à jour un incident
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Incident mis à jour
 */
router.put('/:id', incidentsController.updateIncident);

/**
 * @swagger
 * /incidents/{id}:
 *   delete:
 *     summary: Supprime un incident
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Incident supprimé
 */
router.delete('/:id', requireRole('admin'), incidentsController.deleteIncident);

export default router;