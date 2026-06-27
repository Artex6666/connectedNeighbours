import { Router } from 'express';
import * as newsletterController from '../controllers/newsletter.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router: Router = Router();

router.use(authMiddleware);
router.use(requireRole('admin', 'moderator'));

/**
 * @swagger
 * tags:
 *   name: Newsletter
 *   description: Gestion de la newsletter de quartier (back-office)
 */

/**
 * @swagger
 * /newsletter:
 *   get:
 *     summary: Liste les newsletters (brouillons, planifiées, envoyées)
 *     tags: [Newsletter]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Liste des newsletters }
 *       403: { description: Réservé aux admins/modérateurs }
 */
router.get('/', newsletterController.listNewsletters);

/**
 * @swagger
 * /newsletter/{id}:
 *   get:
 *     summary: Détail d'une newsletter
 *     tags: [Newsletter]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Newsletter trouvée }
 *       404: { description: Introuvable }
 */
router.get('/:id', newsletterController.getNewsletter);

/**
 * @swagger
 * /newsletter:
 *   post:
 *     summary: Crée une newsletter (brouillon, ou planifiée si scheduledAt fourni)
 *     tags: [Newsletter]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject]
 *             properties:
 *               subject: { type: string }
 *               contentHtml: { type: string }
 *               scheduledAt: { type: string, format: date-time }
 *     responses:
 *       201: { description: Newsletter créée }
 *       400: { description: Sujet manquant ou date invalide }
 */
router.post('/', newsletterController.createNewsletter);

/**
 * @swagger
 * /newsletter/{id}:
 *   put:
 *     summary: Met à jour une newsletter (impossible si déjà envoyée)
 *     tags: [Newsletter]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject: { type: string }
 *               contentHtml: { type: string }
 *               scheduledAt: { type: string, format: date-time, nullable: true }
 *     responses:
 *       200: { description: Newsletter mise à jour }
 *       400: { description: Déjà envoyée ou date invalide }
 *       404: { description: Introuvable }
 */
router.put('/:id', newsletterController.updateNewsletter);

/**
 * @swagger
 * /newsletter/{id}:
 *   delete:
 *     summary: Supprime une newsletter
 *     tags: [Newsletter]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Supprimée }
 *       404: { description: Introuvable }
 */
router.delete('/:id', newsletterController.deleteNewsletter);

/**
 * @swagger
 * /newsletter/{id}/send:
 *   post:
 *     summary: Envoie immédiatement la newsletter aux abonnés opt-in
 *     tags: [Newsletter]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Newsletter envoyée }
 *       400: { description: Déjà envoyée }
 *       404: { description: Introuvable }
 */
router.post('/:id/send', newsletterController.sendNewsletter);

export default router;
