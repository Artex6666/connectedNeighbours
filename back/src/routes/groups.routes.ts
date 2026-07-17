import { Router } from 'express';
import * as groupsController from '../controllers/groups.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: Router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Groupes de discussion de quartier (canaux collectifs)
 */

/**
 * @swagger
 * /groups:
 *   get:
 *     summary: Liste les groupes du quartier (avec mon statut de membre)
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Liste des groupes }
 *   post:
 *     summary: Crée un groupe (ouvert à tous)
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               memberIds: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Groupe créé }
 *       400: { description: Nom manquant }
 */
router.get('/', groupsController.listGroups);
router.post('/', groupsController.createGroup);

/**
 * @swagger
 * /groups/messages/{messageId}:
 *   delete:
 *     summary: Supprime un message de groupe (auteur ou modérateur/admin)
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Supprimé }
 *       403: { description: Non autorisé }
 */
router.delete('/messages/:messageId', groupsController.deleteGroupMessage);

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     summary: Détail d'un groupe + messages (membres uniquement)
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Groupe + membres + messages }
 *       403: { description: Non membre }
 *       404: { description: Introuvable }
 *   delete:
 *     summary: Supprime un groupe (créateur ou modérateur/admin)
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Supprimé }
 *       403: { description: Non autorisé }
 */
router.get('/:id', groupsController.getGroup);
router.delete('/:id', groupsController.deleteGroup);

/**
 * @swagger
 * /groups/{id}/messages:
 *   post:
 *     summary: Envoie un message dans le groupe (membres)
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       201: { description: Message envoyé }
 *       403: { description: Non membre }
 */
router.post('/:id/messages', groupsController.sendGroupMessage);

/**
 * @swagger
 * /groups/{id}/join:
 *   post:
 *     summary: Rejoindre un groupe
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Groupe rejoint }
 */
router.post('/:id/join', groupsController.joinGroup);

/**
 * @swagger
 * /groups/{id}/leave:
 *   post:
 *     summary: Quitter un groupe
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Groupe quitté }
 */
router.post('/:id/leave', groupsController.leaveGroup);

export default router;
