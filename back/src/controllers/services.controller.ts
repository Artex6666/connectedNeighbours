import { Request, Response } from 'express';
import { success, error } from '../utils/response.utils';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { notifyNewService } from '../services/email.service';
import { generateServiceContract } from '../services/contract.service';
import Service from '../models/Service.model';
import User from '../models/User.model';

// ─── List services ────────────────────────────────────────────────────────────

/**
 * GET /services — liste les annonces du quartier de l'utilisateur, les plus récentes
 * d'abord. Filtres optionnels : category, status, isPaid. Un admin/modérateur peut
 * passer `all=true` pour ignorer le filtrage par quartier.
 */
export async function listServices(req: Request, res: Response) {
  try {
    const neighborhoodId = req.user?.neighborhoodId;
    const { category, status, isPaid, all } = req.query;
    const isAdminAll =
      all === 'true' && (req.user?.role === 'admin' || req.user?.role === 'moderator');

    const filter: Record<string, unknown> = {};
    if (neighborhoodId && !isAdminAll) filter.neighborhoodId = neighborhoodId;
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

/**
 * GET /services/:id — détail d'une annonce avec son auteur.
 * Répond 404 si l'annonce est introuvable.
 */
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

/**
 * POST /services — publie une annonce dans le quartier de l'utilisateur.
 * Les points ne sont pris en compte que si l'annonce est payante.
 * Répond 400 si un champ obligatoire manque, 403 sans quartier, 201 sinon.
 * Les voisins opt-in sont notifiés par email (envoi non bloquant).
 */
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

    // Notifier par email les voisins opt-in (non bloquant, ignoré si SMTP off).
    try {
      const neighbors = await User.find({
        neighborhoodId,
        _id: { $ne: authorId },
        isBlocked: { $ne: true },
      }).select('email firstName emailPreferences');
      await notifyNewService(neighbors, {
        title: service.title,
        category: service.category,
        isPaid: service.isPaid,
        points: service.points,
      });
    } catch {
      /* email non bloquant */
    }

    return success(res, populated, 201);
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── Update service ───────────────────────────────────────────────────────────

/**
 * PUT /services/:id — modifie une annonce (champs fournis uniquement).
 * Réservé à l'auteur (403) et uniquement tant que l'annonce est au statut « open » (400).
 */
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

/**
 * DELETE /services/:id — supprime une annonce.
 * Réservé à l'auteur ou à un admin (403), 404 si l'annonce est introuvable.
 */
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

/**
 * POST /services/:id/accept — un voisin accepte une annonce ouverte, qui passe
 * « in_progress ». On ne peut pas accepter sa propre annonce (400). Pour une annonce
 * payante, les points du demandeur sont vérifiés puis débités immédiatement (400 si
 * solde insuffisant) et un contrat PDF signable par les deux parties est généré.
 */
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
    let requester = null;
    if (service.isPaid) {
      requester = await User.findById(userId);
      if (!requester) throw new NotFoundError('User not found');
      if (requester.points < service.points) {
        return error(res, `Not enough points (need ${service.points}, have ${requester.points})`, 400);
      }
      // Lock points
      await User.findByIdAndUpdate(userId, { $inc: { points: -service.points } });
    }

    service.status = 'in_progress';
    service.accepterId = userId as never;

    // Service payant → contrat numérique obligatoire, signable par les 2 parties.
    if (service.isPaid && requester) {
      try {
        const author = await User.findById(service.authorId).select('firstName lastName');
        if (author) {
          const contract = await generateServiceContract(service, author, requester);
          service.contractId = contract._id as never;
        }
      } catch (err) {
        console.error('[services] contract generation failed:', (err as Error).message);
      }
    }

    await service.save();

    return success(res, service);
  } catch (err) {
    if (err instanceof NotFoundError) return error(res, err.message, 404);
    return error(res, 'Internal server error', 500);
  }
}

// ─── My services ──────────────────────────────────────────────────────────────

/**
 * GET /services/mine — renvoie les annonces de l'utilisateur : `posted` (celles qu'il
 * a publiées) et `accepted` (celles qu'il a acceptées, en cours ou terminées).
 */
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

/**
 * POST /services/:id/complete — l'auteur clôture une annonce en cours (statut « done »).
 * Pour une annonce payante, les points débités au demandeur sont crédités à l'auteur.
 * Répond 400 si l'annonce n'est pas en cours, 403 si l'appelant n'est pas l'auteur.
 */
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
