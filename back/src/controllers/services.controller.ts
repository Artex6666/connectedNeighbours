import { Request, Response } from 'express';
import { success, error } from '../utils/response.utils';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import Service from '../models/Service.model';
import User from '../models/User.model';

// ─── List services ────────────────────────────────────────────────────────────

export async function listServices(req: Request, res: Response) {
  try {
    const neighborhoodId = req.user?.neighborhoodId;
    const { category, status, isPaid } = req.query;

    const filter: Record<string, unknown> = {};
    if (neighborhoodId) filter.neighborhoodId = neighborhoodId;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (isPaid !== undefined) filter.isPaid = isPaid === 'true';

    const services = await Service.find(filter)
      .populate('authorId', 'firstName lastName role points')
      .sort({ createdAt: -1 });

    return success(res, services);
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── Get service by ID ────────────────────────────────────────────────────────

export async function getService(req: Request, res: Response) {
  try {
    const service = await Service.findById(req.params.id)
      .populate('authorId', 'firstName lastName role points');

    if (!service) throw new NotFoundError('Service not found');

    return success(res, service);
  } catch (err) {
    if (err instanceof NotFoundError) return error(res, err.message, 404);
    return error(res, 'Internal server error', 500);
  }
}

// ─── Create service ───────────────────────────────────────────────────────────

export async function createService(req: Request, res: Response) {
  try {
    const { title, description, category, isPaid, points } = req.body;
    const authorId = req.user?._id;
    const neighborhoodId = req.user?.neighborhoodId;

    if (!title || !description || !category) {
      return error(res, 'title, description and category are required', 400);
    }

    if (!neighborhoodId) {
      return error(res, 'You must belong to a neighborhood to post a service', 403);
    }

    const service = await Service.create({
      title,
      description,
      category,
      isPaid: isPaid ?? false,
      points: isPaid ? (points ?? 0) : 0,
      authorId,
      neighborhoodId,
      status: 'open',
    });

    const populated = await service.populate('authorId', 'firstName lastName role points');
    return success(res, populated, 201);
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── Update service ───────────────────────────────────────────────────────────

export async function updateService(req: Request, res: Response) {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) throw new NotFoundError('Service not found');

    const userId = req.user?._id?.toString();
    if (service.authorId.toString() !== userId) {
      throw new ForbiddenError('Only the author can edit this service');
    }

    if (service.status !== 'open') {
      return error(res, 'Only open services can be edited', 400);
    }

    const { title, description, category, isPaid, points } = req.body;
    if (title) service.title = title;
    if (description) service.description = description;
    if (category) service.category = category;
    if (isPaid !== undefined) service.isPaid = isPaid;
    if (points !== undefined) service.points = points;

    await service.save();
    return success(res, service);
  } catch (err) {
    if (err instanceof NotFoundError) return error(res, err.message, 404);
    if (err instanceof ForbiddenError) return error(res, err.message, 403);
    return error(res, 'Internal server error', 500);
  }
}

// ─── Delete service ───────────────────────────────────────────────────────────

export async function deleteService(req: Request, res: Response) {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) throw new NotFoundError('Service not found');

    const userId = req.user?._id?.toString();
    const userRole = req.user?.role;

    if (service.authorId.toString() !== userId && userRole !== 'admin') {
      throw new ForbiddenError('Only the author or an admin can delete this service');
    }

    await service.deleteOne();
    return success(res, { message: 'Service deleted' });
  } catch (err) {
    if (err instanceof NotFoundError) return error(res, err.message, 404);
    if (err instanceof ForbiddenError) return error(res, err.message, 403);
    return error(res, 'Internal server error', 500);
  }
}

// ─── Accept service ───────────────────────────────────────────────────────────

export async function acceptService(req: Request, res: Response) {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) throw new NotFoundError('Service not found');

    if (service.status !== 'open') {
      return error(res, 'This service is no longer available', 400);
    }

    const userId = req.user?._id?.toString();
    if (service.authorId.toString() === userId) {
      return error(res, 'You cannot accept your own service', 400);
    }

    // Check requester has enough points for paid services
    if (service.isPaid) {
      const requester = await User.findById(userId);
      if (!requester) throw new NotFoundError('User not found');
      if (requester.points < service.points) {
        return error(res, `Not enough points (need ${service.points}, have ${requester.points})`, 400);
      }
      // Lock points
      await User.findByIdAndUpdate(userId, { $inc: { points: -service.points } });
    }

    service.status = 'in_progress';
    service.accepterId = userId as never;
    await service.save();

    return success(res, service);
  } catch (err) {
    if (err instanceof NotFoundError) return error(res, err.message, 404);
    return error(res, 'Internal server error', 500);
  }
}

// ─── My services ──────────────────────────────────────────────────────────────

export async function myServices(req: Request, res: Response) {
  try {
    const userId = req.user?._id;

    const [posted, accepted] = await Promise.all([
      Service.find({ authorId: userId })
        .populate('accepterId', 'firstName lastName')
        .sort({ createdAt: -1 }),
      Service.find({ accepterId: userId, status: { $in: ['in_progress', 'done'] } })
        .populate('authorId', 'firstName lastName role points')
        .sort({ updatedAt: -1 }),
    ]);

    return success(res, { posted, accepted });
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── Complete service ─────────────────────────────────────────────────────────

export async function completeService(req: Request, res: Response) {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) throw new NotFoundError('Service not found');

    if (service.status !== 'in_progress') {
      return error(res, 'Service is not in progress', 400);
    }

    const userId = req.user?._id?.toString();
    if (service.authorId.toString() !== userId) {
      throw new ForbiddenError('Only the author can mark the service as complete');
    }

    // Transfer points to author
    if (service.isPaid) {
      await User.findByIdAndUpdate(service.authorId, { $inc: { points: service.points } });
    }

    service.status = 'done';
    await service.save();

    return success(res, service);
  } catch (err) {
    if (err instanceof NotFoundError) return error(res, err.message, 404);
    if (err instanceof ForbiddenError) return error(res, err.message, 403);
    return error(res, 'Internal server error', 500);
  }
}
