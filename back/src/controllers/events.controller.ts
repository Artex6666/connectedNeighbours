import { Request, Response } from 'express';
import { success, error } from '../utils/response.utils';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import Event from '../models/Event.model';

// ─── List events ──────────────────────────────────────────────────────────────

/**
 * GET /events — liste les événements du quartier de l'utilisateur, triés par date croissante.
 * Les événements annulés sont masqués par défaut. Un admin/modérateur peut passer
 * `all=true` (tous les quartiers) et/ou `includeCancelled=true`.
 */
export async function listEvents(req: Request, res: Response) {
  try {
    const neighborhoodId = req.user?.neighborhoodId;
    const { all, includeCancelled } = req.query;
    const isAdminAll =
      all === 'true' && (req.user?.role === 'admin' || req.user?.role === 'moderator');
    const showCancelled =
      includeCancelled === 'true' &&
      (req.user?.role === 'admin' || req.user?.role === 'moderator');

    const filter: Record<string, unknown> = {};
    if (!showCancelled) filter.isCancelled = false;
    if (neighborhoodId && !isAdminAll) filter.neighborhoodId = neighborhoodId;

    const events = await Event.find(filter)
      .populate('organizerId', 'firstName lastName role')
      .populate('participants', 'firstName lastName role')
      .populate('waitingList', 'firstName lastName role')
      .sort({ date: 1 });

    return success(res, events);
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── Get event by ID ──────────────────────────────────────────────────────────

/**
 * GET /events/:id — détail d'un événement avec l'organisateur, les participants
 * et la liste d'attente. Répond 404 si l'événement n'existe pas.
 */
export async function getEvent(req: Request, res: Response) {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizerId', 'firstName lastName role')
      .populate('participants', 'firstName lastName role')
      .populate('waitingList', 'firstName lastName role');

    if (!event) throw new NotFoundError('Event not found');

    return success(res, event);
  } catch (err) {
    if (err instanceof NotFoundError) return error(res, err.message, 404);
    return error(res, 'Internal server error', 500);
  }
}

// ─── Create event ─────────────────────────────────────────────────────────────

/**
 * POST /events — crée un événement ; l'organisateur est inscrit comme premier participant.
 * Répond 400 si un champ obligatoire manque, 403 si l'utilisateur n'a pas de quartier.
 */
export async function createEvent(req: Request, res: Response) {
  try {
    const { title, description, date, location, maxParticipants } = req.body;
    const organizerId = req.user?._id;
    const neighborhoodId = req.user?.neighborhoodId;

    if (!title || !description || !date || !location || !maxParticipants) {
      return error(res, 'title, description, date, location and maxParticipants are required', 400);
    }

    if (!neighborhoodId) {
      return error(res, 'You must belong to a neighborhood to create an event', 403);
    }

    const event = await Event.create({
      title,
      description,
      date: new Date(date),
      location,
      maxParticipants,
      organizerId,
      neighborhoodId,
      participants: [organizerId],
    });

    const populated = await event.populate('organizerId', 'firstName lastName role');
    return success(res, populated, 201);
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── Update event ─────────────────────────────────────────────────────────────

/**
 * PUT /events/:id — met à jour un événement (champs fournis uniquement).
 * Réservé à l'organisateur (403), impossible sur un événement annulé (400) et
 * `maxParticipants` ne peut pas descendre sous le nombre d'inscrits actuel (400).
 */
export async function updateEvent(req: Request, res: Response) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) throw new NotFoundError('Event not found');

    const userId = req.user?._id?.toString();
    if (event.organizerId.toString() !== userId) {
      throw new ForbiddenError('Only the organizer can edit this event');
    }

    if (event.isCancelled) {
      return error(res, 'Cannot edit a cancelled event', 400);
    }

    const { title, description, date, location, maxParticipants } = req.body;
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = new Date(date);
    if (location) event.location = location;
    if (maxParticipants !== undefined) {
      if (maxParticipants < event.participants.length) {
        return error(res, 'maxParticipants cannot be less than current participant count', 400);
      }
      event.maxParticipants = maxParticipants;
    }

    await event.save();
    return success(res, event);
  } catch (err) {
    if (err instanceof NotFoundError) return error(res, err.message, 404);
    if (err instanceof ForbiddenError) return error(res, err.message, 403);
    return error(res, 'Internal server error', 500);
  }
}

// ─── Delete / cancel event ────────────────────────────────────────────────────

/**
 * DELETE /events/:id — annule un événement (marquage `isCancelled`, pas de suppression).
 * Réservé à l'organisateur ou à un admin (403), 404 si l'événement est introuvable.
 */
export async function deleteEvent(req: Request, res: Response) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) throw new NotFoundError('Event not found');

    const userId = req.user?._id?.toString();
    const userRole = req.user?.role;

    if (event.organizerId.toString() !== userId && userRole !== 'admin') {
      throw new ForbiddenError('Only the organizer or an admin can cancel this event');
    }

    event.isCancelled = true;
    await event.save();

    return success(res, { message: 'Event cancelled' });
  } catch (err) {
    if (err instanceof NotFoundError) return error(res, err.message, 404);
    if (err instanceof ForbiddenError) return error(res, err.message, 403);
    return error(res, 'Internal server error', 500);
  }
}

// ─── Register to event ────────────────────────────────────────────────────────

/**
 * POST /events/:id/register — inscrit l'utilisateur à l'événement.
 * S'il reste de la place il devient participant, sinon il est placé en liste d'attente.
 * Répond 400 si l'événement est annulé ou s'il est déjà inscrit.
 */
export async function registerToEvent(req: Request, res: Response) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) throw new NotFoundError('Event not found');

    if (event.isCancelled) {
      return error(res, 'This event has been cancelled', 400);
    }

    const userId = req.user?._id?.toString()!;
    const alreadyParticipant = event.participants.some((p) => p.toString() === userId);
    const alreadyWaiting = event.waitingList.some((p) => p.toString() === userId);

    if (alreadyParticipant || alreadyWaiting) {
      return error(res, 'You are already registered for this event', 400);
    }

    if (event.participants.length < event.maxParticipants) {
      event.participants.push(userId as never);
    } else {
      event.waitingList.push(userId as never);
    }

    await event.save();

    const populated = await Event.findById(event._id)
      .populate('organizerId', 'firstName lastName role')
      .populate('participants', 'firstName lastName role')
      .populate('waitingList', 'firstName lastName role');

    return success(res, populated);
  } catch (err) {
    if (err instanceof NotFoundError) return error(res, err.message, 404);
    return error(res, 'Internal server error', 500);
  }
}

// ─── Unregister from event ────────────────────────────────────────────────────

/**
 * DELETE /events/:id/register — désinscrit l'utilisateur de l'événement.
 * Si une place de participant se libère, la première personne en liste d'attente est
 * promue automatiquement. Répond 400 s'il n'était pas inscrit ou si l'événement est annulé.
 */
export async function unregisterFromEvent(req: Request, res: Response) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) throw new NotFoundError('Event not found');

    if (event.isCancelled) {
      return error(res, 'This event has been cancelled', 400);
    }

    const userId = req.user?._id?.toString()!;
    const participantIndex = event.participants.findIndex((p) => p.toString() === userId);
    const waitingIndex = event.waitingList.findIndex((p) => p.toString() === userId);

    if (participantIndex === -1 && waitingIndex === -1) {
      return error(res, 'You are not registered for this event', 400);
    }

    if (participantIndex !== -1) {
      event.participants.splice(participantIndex, 1);
      // Promote first person from waiting list
      if (event.waitingList.length > 0) {
        const promoted = event.waitingList.shift()!;
        event.participants.push(promoted);
      }
    } else {
      event.waitingList.splice(waitingIndex, 1);
    }

    await event.save();

    const populated = await Event.findById(event._id)
      .populate('organizerId', 'firstName lastName role')
      .populate('participants', 'firstName lastName role')
      .populate('waitingList', 'firstName lastName role');

    return success(res, populated);
  } catch (err) {
    if (err instanceof NotFoundError) return error(res, err.message, 404);
    return error(res, 'Internal server error', 500);
  }
}
