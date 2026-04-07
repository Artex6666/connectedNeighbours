import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

/** GET /messages — Liste des conversations */
router.get('/', messagesController.listConversations);

/** GET /messages/:userId — Messages avec un utilisateur */
router.get('/:userId', messagesController.getConversation);

/** POST /messages/:userId — Envoyer un message */
router.post('/:userId', messagesController.sendMessage);

/** DELETE /messages/:id — Supprimer un message */
router.delete('/:id', messagesController.deleteMessage);

export default router;
