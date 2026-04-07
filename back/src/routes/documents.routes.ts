import { Router } from 'express';
import * as documentsController from '../controllers/documents.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { mfaMiddleware } from '../middlewares/mfa.middleware';

const router = Router();

router.use(authMiddleware);

/** GET /documents — Mes documents */
router.get('/', documentsController.listDocuments);

/** GET /documents/:id — Détail d'un document */
router.get('/:id', documentsController.getDocument);

/** POST /documents — Importer un document PDF */
router.post('/', documentsController.uploadDocument);

/** POST /documents/:id/send — Envoyer pour signature */
router.post('/:id/send', documentsController.sendForSignature);

/** POST /documents/:id/sign — Signer un document (MFA requis) */
router.post('/:id/sign', mfaMiddleware, documentsController.signDocument);

/** GET /documents/:id/verify — Vérifier l'intégrité du document */
router.get('/:id/verify', documentsController.verifyDocument);

export default router;
