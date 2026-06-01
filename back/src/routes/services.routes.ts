import { Router } from 'express';
import * as servicesController from '../controllers/services.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: Router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Neighborhood service listings and point-based exchanges
 */

/**
 * @swagger
 * /services:
 *   get:
 *     summary: List services in the user's neighborhood
 *     tags: [Services]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [bricolage, jardinage, garde_animaux, cours_particuliers, demenagement, autre]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, pending, in_progress, done, cancelled]
 *       - in: query
 *         name: isPaid
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of services
 */
/**
 * @swagger
 * /services/mine:
 *   get:
 *     summary: Get current user's posted and accepted services
 *     tags: [Services]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Object with posted[] and accepted[] arrays
 */
router.get('/mine', servicesController.myServices);

router.get('/', servicesController.listServices);

/**
 * @swagger
 * /services/{id}:
 *   get:
 *     summary: Get a service by ID
 *     tags: [Services]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Service details
 *       404:
 *         description: Service not found
 */
router.get('/:id', servicesController.getService);

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Create a new service listing
 *     tags: [Services]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, category]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               category:
 *                 type: string
 *                 enum: [bricolage, jardinage, garde_animaux, cours_particuliers, demenagement, autre]
 *               isPaid: { type: boolean, default: false }
 *               points: { type: number, minimum: 0 }
 *     responses:
 *       201:
 *         description: Service created
 *       403:
 *         description: User has no neighborhood
 */
router.post('/', servicesController.createService);

/**
 * @swagger
 * /services/{id}:
 *   put:
 *     summary: Update a service (author only, status must be open)
 *     tags: [Services]
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
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               isPaid: { type: boolean }
 *               points: { type: number }
 *     responses:
 *       200:
 *         description: Updated service
 *       403:
 *         description: Not the author
 *       404:
 *         description: Service not found
 */
router.put('/:id', servicesController.updateService);

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     summary: Delete a service (author or admin)
 *     tags: [Services]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Service deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Service not found
 */
router.delete('/:id', servicesController.deleteService);

/**
 * @swagger
 * /services/{id}/accept:
 *   post:
 *     summary: Accept a service request (deducts points if paid)
 *     tags: [Services]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Service accepted, status set to in_progress
 *       400:
 *         description: Not enough points or service unavailable
 */
router.post('/:id/accept', servicesController.acceptService);

/**
 * @swagger
 * /services/{id}/complete:
 *   post:
 *     summary: Mark service as complete (author only, transfers points)
 *     tags: [Services]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Service completed, points transferred
 *       403:
 *         description: Only the author can complete
 */
router.post('/:id/complete', servicesController.completeService);

export default router;
