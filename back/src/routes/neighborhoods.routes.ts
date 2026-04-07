import { Router } from 'express';
import * as neighborhoodsController from '../controllers/neighborhoods.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);

/** GET /neighborhoods — Liste des quartiers */
router.get('/', neighborhoodsController.listNeighborhoods);

/** GET /neighborhoods/:id — Détail d'un quartier */
router.get('/:id', neighborhoodsController.getNeighborhood);

/** POST /neighborhoods — Créer un quartier (admin) */
router.post('/', requireRole('admin'), neighborhoodsController.createNeighborhood);

/** PUT /neighborhoods/:id — Modifier un quartier (admin) */
router.put('/:id', requireRole('admin'), neighborhoodsController.updateNeighborhood);

/** DELETE /neighborhoods/:id — Supprimer un quartier (admin) */
router.delete('/:id', requireRole('admin'), neighborhoodsController.deleteNeighborhood);

export default router;
