import { Router } from 'express';
import * as servicesController from '../controllers/services.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

/** GET /services — Annonces du quartier */
router.get('/', servicesController.listServices);

/** GET /services/:id — Détail d'une annonce */
router.get('/:id', servicesController.getService);

/** POST /services — Publier une annonce */
router.post('/', servicesController.createService);

/** PUT /services/:id — Modifier une annonce */
router.put('/:id', servicesController.updateService);

/** DELETE /services/:id — Supprimer une annonce */
router.delete('/:id', servicesController.deleteService);

/** POST /services/:id/accept — Accepter une demande de service */
router.post('/:id/accept', servicesController.acceptService);

/** POST /services/:id/complete — Valider la fin de prestation */
router.post('/:id/complete', servicesController.completeService);

export default router;
