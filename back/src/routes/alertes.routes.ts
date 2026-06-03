import { Router } from 'express';
import * as alertesController from '../controllers/alertes.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router: Router = Router();

router.use(authMiddleware);
router.use(requireRole('admin', 'moderator'));

/**
 * @swagger
 * /alertes:
 *   get:
 *     summary: Liste les alertes
 *     tags: [Alertes]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste des alertes
 */
router.get('/', alertesController.listAlertes);

/**
 * @swagger
 * /alertes/{id}:
 *   get:
 *     summary: Détail d'une alerte
 *     tags: [Alertes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alerte trouvée
 *       404:
 *         description: Alerte introuvable
 */
router.get('/:id', alertesController.getAlerte);

/**
 * @swagger
 * /alertes:
 *   post:
 *     summary: Crée une alerte
 *     tags: [Alertes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message]
 *             properties:
 *               title: { type: string }
 *               message: { type: string }
 *               level:
 *                 type: string
 *                 enum: [info, warning, danger]
 *     responses:
 *       201:
 *         description: Alerte créée
 */
router.post('/', alertesController.createAlerte);

/**
 * @swagger
 * /alertes/{id}:
 *   put:
 *     summary: Met à jour une alerte
 *     tags: [Alertes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alerte mise à jour
 */
router.put('/:id', alertesController.updateAlerte);

/**
 * @swagger
 * /alertes/{id}:
 *   delete:
 *     summary: Supprime une alerte
 *     tags: [Alertes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alerte supprimée
 */
router.delete('/:id', requireRole('admin'), alertesController.deleteAlerte);

export default router;