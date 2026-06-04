import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { messageUpload } from '../middlewares/upload.middleware';

const router: Router = Router();

router.use(authMiddleware);

/** GET /messages — Liste des conversations */
router.get('/', messagesController.listConversations);

/** GET /messages/:userId — Messages avec un utilisateur */
router.get('/:userId', messagesController.getConversation);

/** POST /messages/:userId — Envoyer un message texte */
router.post('/:userId', messagesController.sendMessage);

/** POST /messages/:userId/upload — Envoyer une image ou un vocal (multipart/form-data, champ "file") */
router.post('/:userId/upload', messageUpload.single('file'), messagesController.uploadAttachment);

/** DELETE /messages/:id — Supprimer un message */
router.delete('/:id', messagesController.deleteMessage);

export default router;
