import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);

/** GET /users/me — Profil courant */
router.get('/me', usersController.getMe);

/** PUT /users/me — Modifier son profil */
router.put('/me', usersController.updateMe);

/** GET /users/:id — Profil public d'un utilisateur */
router.get('/:id', usersController.getUserById);

/** GET /users — Liste des habitants (admin/modérateur) */
router.get('/', requireRole('admin', 'moderator'), usersController.listUsers);

/** DELETE /users/:id — Supprimer un compte (admin) */
router.delete('/:id', requireRole('admin'), usersController.deleteUser);

export default router;
