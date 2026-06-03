import { Router } from 'express';
import * as statsController from '../controllers/stats.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router: Router = Router();

router.use(authMiddleware);
router.use(requireRole('admin', 'moderator'));

/**
 * @swagger
 * /stats/dashboard:
 *   get:
 *     summary: Statistiques du dashboard
 *     tags: [Stats]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Statistiques générales
 */
router.get('/dashboard', statsController.dashboard);

export default router;