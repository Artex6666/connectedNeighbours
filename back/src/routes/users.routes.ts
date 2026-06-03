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

export default router;
