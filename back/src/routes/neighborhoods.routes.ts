import { Router } from 'express';
import * as neighborhoodsController from '../controllers/neighborhoods.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router: Router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Neighborhoods
 *   description: Quartiers — modélisation géographique (polygones GeoJSON, sans chevauchement)
 */

/**
 * @swagger
 * /neighborhoods:
 *   get:
 *     summary: Liste tous les quartiers
 *     tags: [Neighborhoods]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste des quartiers (avec l'admin référent peuplé)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Neighborhood' }
 */
router.get('/', neighborhoodsController.listNeighborhoods);

/**
 * @swagger
 * /neighborhoods/{id}:
 *   get:
 *     summary: Détail d'un quartier
 *     tags: [Neighborhoods]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Quartier trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Neighborhood' }
 *       404:
 *         description: Quartier introuvable
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.get('/:id', neighborhoodsController.getNeighborhood);

/**
 * @swagger
 * /neighborhoods:
 *   post:
 *     summary: Créer un quartier (admin)
 *     description: >
 *       Le polygone doit être un anneau GeoJSON fermé (≥ 4 points, premier = dernier).
 *       La création est rejetée (409) si le polygone chevauche un quartier existant.
 *     tags: [Neighborhoods]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, polygon]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               polygon: { $ref: '#/components/schemas/Polygon' }
 *     responses:
 *       201:
 *         description: Quartier créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Neighborhood' }
 *       400:
 *         description: Nom ou polygone invalide
 *       403:
 *         description: Réservé aux administrateurs
 *       409:
 *         description: Le polygone chevauche un quartier existant
 */
router.post('/', requireRole('admin'), neighborhoodsController.createNeighborhood);

/**
 * @swagger
 * /neighborhoods/{id}:
 *   put:
 *     summary: Modifier un quartier (admin)
 *     tags: [Neighborhoods]
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
 *               name: { type: string }
 *               description: { type: string }
 *               polygon: { $ref: '#/components/schemas/Polygon' }
 *     responses:
 *       200:
 *         description: Quartier mis à jour
 *       400:
 *         description: Polygone invalide
 *       403:
 *         description: Réservé aux administrateurs
 *       404:
 *         description: Quartier introuvable
 *       409:
 *         description: Le polygone chevauche un quartier existant
 */
router.put('/:id', requireRole('admin'), neighborhoodsController.updateNeighborhood);

/**
 * @swagger
 * /neighborhoods/{id}:
 *   delete:
 *     summary: Supprimer un quartier (admin)
 *     description: Refusé (409) tant que des habitants y sont rattachés.
 *     tags: [Neighborhoods]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Quartier supprimé
 *       403:
 *         description: Réservé aux administrateurs
 *       404:
 *         description: Quartier introuvable
 *       409:
 *         description: Des habitants sont encore rattachés à ce quartier
 */
router.delete('/:id', requireRole('admin'), neighborhoodsController.deleteNeighborhood);

export default router;
