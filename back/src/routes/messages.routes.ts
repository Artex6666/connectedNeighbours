import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { messageUpload } from '../middlewares/upload.middleware';

const router: Router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /messages/reports:
 *   get:
 *     summary: Liste les messages signalés en attente (admin/modérateur)
 *     tags: [Messages]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Signalements en attente }
 *       403: { description: Réservé aux admins/modérateurs }
 */
router.get('/reports', requireRole('admin', 'moderator'), messagesController.listReports);

/**
 * @swagger
 * /messages/reports/{id}:
 *   put:
 *     summary: Traite un signalement (admin/modérateur)
 *     tags: [Messages]
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [reviewed, dismissed] }
 *     responses:
 *       200: { description: Signalement traité }
 *       400: { description: Statut invalide }
 */
router.put('/reports/:id', requireRole('admin', 'moderator'), messagesController.resolveReport);

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Messagerie privée entre habitants (texte, photos, messages vocaux)
 */

/**
 * @swagger
 * /messages:
 *   get:
 *     summary: Liste les conversations de l'utilisateur courant
 *     description: Une entrée par interlocuteur, avec le dernier message échangé.
 *     tags: [Messages]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste des conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ConversationSummary' }
 */
router.get('/', messagesController.listConversations);

/**
 * @swagger
 * /messages/{userId}:
 *   get:
 *     summary: Récupère la conversation avec un habitant
 *     tags: [Messages]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: ID de l'autre habitant
 *     responses:
 *       200:
 *         description: Détail de la conversation (participant + messages triés par date)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     participant: { $ref: '#/components/schemas/ConversationSummary' }
 *                     messages:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Message' }
 *       404:
 *         description: Conversation introuvable
 */
router.get('/:userId', messagesController.getConversation);

/**
 * @swagger
 * /messages/{userId}:
 *   post:
 *     summary: Envoie un message texte à un habitant
 *     tags: [Messages]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               type: { type: string, enum: [text], default: text }
 *     responses:
 *       201:
 *         description: Message créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Message' }
 *       400:
 *         description: Contenu manquant
 *       404:
 *         description: Destinataire introuvable
 */
router.post('/:userId', messagesController.sendMessage);

/**
 * @swagger
 * /messages/{userId}/upload:
 *   post:
 *     summary: Envoie une image ou un message vocal
 *     description: Multipart ; le type (photo/audio) est déduit du MIME du fichier. Taille max 15 Mo.
 *     tags: [Messages]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *               type: { type: string, enum: [photo, audio] }
 *     responses:
 *       201:
 *         description: Message média créé (le champ content contient l'URL publique)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Message' }
 *       400:
 *         description: Aucun fichier, ou type non autorisé
 *       404:
 *         description: Destinataire introuvable
 */
router.post('/:userId/upload', messageUpload.single('file'), messagesController.uploadAttachment);

/**
 * @swagger
 * /messages/{id}:
 *   delete:
 *     summary: Supprime un de ses propres messages
 *     tags: [Messages]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID du message
 *     responses:
 *       200:
 *         description: Message supprimé
 *       404:
 *         description: Message introuvable (ou l'utilisateur n'en est pas l'expéditeur)
 */
router.delete('/:id', messagesController.deleteMessage);

/**
 * @swagger
 * /messages/{id}/report:
 *   post:
 *     summary: Signale un message inapproprié
 *     tags: [Messages]
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
 *               reason: { type: string }
 *     responses:
 *       201: { description: Signalement enregistré }
 *       404: { description: Message introuvable }
 */
router.post('/:id/report', messagesController.reportMessage);

export default router;
