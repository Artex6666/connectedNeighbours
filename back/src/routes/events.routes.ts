import { Router } from 'express';
import * as eventsController from '../controllers/events.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

/** GET /events — Événements du quartier */
router.get('/', eventsController.listEvents);

/** GET /events/:id — Détail d'un événement */
router.get('/:id', eventsController.getEvent);

/** POST /events — Créer un événement */
router.post('/', eventsController.createEvent);

/** PUT /events/:id — Modifier un événement */
router.put('/:id', eventsController.updateEvent);

/** DELETE /events/:id — Annuler/supprimer un événement */
router.delete('/:id', eventsController.deleteEvent);

/** POST /events/:id/register — S'inscrire à un événement */
router.post('/:id/register', eventsController.registerToEvent);

/** DELETE /events/:id/register — Se désinscrire d'un événement */
router.delete('/:id/register', eventsController.unregisterFromEvent);

export default router;
