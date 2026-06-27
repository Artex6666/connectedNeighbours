import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router: Router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Retourne le profil de l'utilisateur connecté
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profil courant
 *       401:
 *         description: Non authentifié
 */
router.get('/me', usersController.getMe);

/**
 * @swagger
 * /users/neighbors:
 *   get:
 *     summary: Liste les autres habitants du quartier courant (pour démarrer une conversation)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste des voisins
 */
router.get('/neighbors', usersController.listMyNeighbors);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Met à jour le profil de l'utilisateur connecté
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *       401:
 *         description: Non authentifié
 */
router.put('/me', usersController.updateMe);

/**
 * @swagger
 * /users/me/preferences:
 *   put:
 *     summary: Met à jour les préférences de notification email
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messages: { type: boolean }
 *               annonces: { type: boolean }
 *               events: { type: boolean }
 *               newsletter: { type: boolean }
 *     responses:
 *       200: { description: Préférences mises à jour }
 *       400: { description: Aucune préférence valide fournie }
 */
router.put('/me/preferences', usersController.updateMyPreferences);

/**
 * @swagger
 * /users/heartbeat:
 *   post:
 *     summary: Signale que l'utilisateur est en ligne (met à jour lastSeenAt)
 *     description: À appeler périodiquement (~30s) tant que l'app est ouverte. Pilote la présence et l'envoi d'email "hors ligne".
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Présence enregistrée }
 */
router.post('/heartbeat', usersController.heartbeat);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Retourne le profil public d'un utilisateur
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID MongoDB de l'utilisateur
 *     responses:
 *       200:
 *         description: Profil trouvé
 *       404:
 *         description: Utilisateur introuvable
 */
router.get('/:id', usersController.getUserById);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Liste tous les utilisateurs (admin/modérateur)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *       403:
 *         description: Permissions insuffisantes
 */
router.get('/', requireRole('admin', 'moderator'), usersController.listUsers);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Supprime un compte utilisateur (admin)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID MongoDB de l'utilisateur
 *     responses:
 *       200:
 *         description: Compte supprimé
 *       404:
 *         description: Utilisateur introuvable
 *       403:
 *         description: Permissions insuffisantes
 */
router.delete('/:id', requireRole('admin'), usersController.deleteUser);

/**
 * @swagger
 * /users/{id}/role:
 *   put:
 *     summary: Change le rôle d'un utilisateur (admin)
 *     tags: [Users]
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [resident, moderator, admin]
 *     responses:
 *       200:
 *         description: Rôle mis à jour
 */
router.put('/:id/role', requireRole('admin'), usersController.updateUserRole);

/**
 * @swagger
 * /users/{id}/neighborhood:
 *   put:
 *     summary: Rattache un utilisateur à un quartier (admin)
 *     tags: [Users]
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
 *             properties:
 *               neighborhoodId: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Quartier mis à jour
 */
router.put('/:id/neighborhood', requireRole('admin'), usersController.updateUserNeighborhood);

/**
 * @swagger
 * /users/{id}/block:
 *   put:
 *     summary: Bloque ou débloque un compte (admin/modérateur)
 *     description: Bloquer révoque aussi toutes les sessions actives de l'utilisateur.
 *     tags: [Users]
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
 *             required: [blocked]
 *             properties:
 *               blocked: { type: boolean }
 *     responses:
 *       200: { description: Statut de blocage mis à jour }
 *       400: { description: Champ manquant ou auto-blocage }
 *       404: { description: Utilisateur introuvable }
 */
router.put('/:id/block', requireRole('admin', 'moderator'), usersController.setUserBlocked);

export default router;
