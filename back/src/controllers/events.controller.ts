import { Request, Response } from 'express';
import { success, error } from '../utils/response.utils';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import Event from '../models/Event.model';

// ─── List events ──────────────────────────────────────────────────────────────

export async function listEvents(req: Request, res: Response) {
  try {
    const neighborhoodId = req.user?.neighborhoodId;

    const filter: Record<string, unknown> = { isCancelled: false };
    if (neighborhoodId) filter.neighborhoodId = neighborhoodId;

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
