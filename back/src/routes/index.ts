import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import neighborhoodsRoutes from './neighborhoods.routes';
import servicesRoutes from './services.routes';
import eventsRoutes from './events.routes';
import messagesRoutes from './messages.routes';
import votesRoutes from './votes.routes';
import documentsRoutes from './documents.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/neighborhoods', neighborhoodsRoutes);
router.use('/services', servicesRoutes);
router.use('/events', eventsRoutes);
router.use('/messages', messagesRoutes);
router.use('/votes', votesRoutes);
router.use('/documents', documentsRoutes);

export default router;
