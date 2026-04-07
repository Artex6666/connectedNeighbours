import { Router } from 'express';
import * as votesController from '../controllers/votes.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

/** GET /votes — Votes du quartier */
router.get('/', votesController.listVotes);

/** GET /votes/:id — Détail d'un vote */
router.get('/:id', votesController.getVote);

/** POST /votes — Créer un vote */
router.post('/', votesController.createVote);

/** POST /votes/:id/cast — Voter */
router.post('/:id/cast', votesController.castVote);

/** DELETE /votes/:id — Supprimer un vote (auteur/admin) */
router.delete('/:id', votesController.deleteVote);

export default router;
