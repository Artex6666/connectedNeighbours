import { Router } from 'express';
import * as eventsController from '../controllers/events.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: Router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Neighborhood events — create, join, and manage local gatherings
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: List upcoming events in the user's neighborhood
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of non-cancelled events sorted by date ascending
 */
router.get('/', eventsController.listEvents);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event details (with participants and waiting list)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event details with populated organizer, participants and waitingList
 *       404:
 *         description: Event not found
 */
router.get('/:id', eventsController.getEvent);

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, date, location, maxParticipants]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               date: { type: string, format: date-time }
 *               location: { type: string }
 *               maxParticipants: { type: number, minimum: 1 }
 *     responses:
 *       201:
 *         description: Event created, organizer added as first participant
 *       403:
 *         description: User has no neighborhood
 */
router.post('/', eventsController.createEvent);

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update an event (organizer only, cannot reduce maxParticipants below current count)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               date: { type: string, format: date-time }
 *               location: { type: string }
 *               maxParticipants: { type: number, minimum: 1 }
 *     responses:
 *       200:
 *         description: Updated event
 *       400:
 *         description: Event is cancelled or maxParticipants too low
 *       403:
 *         description: Not the organizer
 *       404:
 *         description: Event not found
 */
router.put('/:id', eventsController.updateEvent);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Cancel an event (organizer or admin only)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event cancelled
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
router.delete('/:id', eventsController.deleteEvent);

/**
 * @swagger
 * /events/{id}/register:
 *   post:
 *     summary: Register to an event (joins waiting list if full)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Registered as participant or added to waiting list
 *       400:
 *         description: Already registered or event is cancelled
 *       404:
 *         description: Event not found
 */
router.post('/:id/register', eventsController.registerToEvent);

/**
 * @swagger
 * /events/{id}/register:
 *   delete:
 *     summary: Unregister from an event (promotes first person from waiting list)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Unregistered, waiting list promoted if applicable
 *       400:
 *         description: Not registered or event is cancelled
 *       404:
 *         description: Event not found
 */
router.delete('/:id/register', eventsController.unregisterFromEvent);

export default router;
