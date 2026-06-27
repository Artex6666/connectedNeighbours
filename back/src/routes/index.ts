import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import neighborhoodsRoutes from './neighborhoods.routes';
import servicesRoutes from './services.routes';
import eventsRoutes from './events.routes';
import messagesRoutes from './messages.routes';
import votesRoutes from './votes.routes';
import documentsRoutes from './documents.routes';

import incidentsRoutes from './incidents.routes';
import alertesRoutes from './alertes.routes';
import statsRoutes from './stats.routes';
import newsletterRoutes from './newsletter.routes';
import groupsRoutes from './groups.routes';
import publicRoutes from './public.routes';

const router: Router = Router();

// Public showcase (no auth) — must stay open.
router.use('/public', publicRoutes);

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/neighborhoods', neighborhoodsRoutes);
router.use('/services', servicesRoutes);
router.use('/events', eventsRoutes);
router.use('/messages', messagesRoutes);
router.use('/votes', votesRoutes);
router.use('/documents', documentsRoutes);

router.use('/incidents', incidentsRoutes);
router.use('/alertes', alertesRoutes);
router.use('/stats', statsRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/groups', groupsRoutes);

export default router;
