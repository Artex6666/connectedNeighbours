import { Request, Response } from 'express';
import { success } from '../utils/response.utils';
import User from '../models/User.model';
import Neighborhood from '../models/Neighborhood.model';
import Service from '../models/Service.model';
import Event from '../models/Event.model';
import Vote from '../models/Vote.model';

/**
 * Public, read-only showcase endpoints (no auth). They expose non-sensitive data
 * so visitors can browse neighbourhoods, recent listings, featured polls and
 * upcoming events before signing up. No emails, no private content.
 */

export async function publicStats(_req: Request, res: Response) {
  const [neighborhoods, residents, services, events, votes] = await Promise.all([
    Neighborhood.countDocuments(),
    User.countDocuments({ isBlocked: { $ne: true } }),
    Service.countDocuments(),
    Event.countDocuments({ isCancelled: { $ne: true } }),
    Vote.countDocuments(),
  ]);
  return success(res, { neighborhoods, residents, services, events, votes });
}

export async function publicNeighborhoods(_req: Request, res: Response) {
  const neighborhoods = await Neighborhood.find()
    .select('name description polygon')
    .sort({ createdAt: -1 })
    .lean();
  return success(res, neighborhoods);
}

export async function publicServices(_req: Request, res: Response) {
  const services = await Service.find({ status: { $in: ['open', 'in_progress'] } })
    .sort({ createdAt: -1 })
    .limit(12)
    .populate('authorId', 'firstName role')
    .populate('neighborhoodId', 'name')
    .lean();

  return success(
    res,
    services.map((s) => {
      const author = s.authorId as unknown as { firstName?: string; role?: string };
      const hood = s.neighborhoodId as unknown as { name?: string };
      return {
        _id: s._id,
        title: s.title,
        description: s.description?.slice(0, 160) ?? '',
        category: s.category,
        isPaid: s.isPaid,
        points: s.points,
        status: s.status,
        authorFirstName: author?.firstName ?? null,
        authorRole: author?.role ?? null,
        neighborhoodName: hood?.name ?? null,
        createdAt: s.createdAt,
      };
    }),
  );
}

export async function publicVotes(_req: Request, res: Response) {
  const votes = await Vote.find()
    .sort({ createdAt: -1 })
    .limit(8)
    .populate('authorId', 'firstName role')
    .populate('neighborhoodId', 'name')
    .lean();

  return success(
    res,
    votes.map((v) => {
      const author = v.authorId as unknown as { firstName?: string; role?: string };
      const hood = v.neighborhoodId as unknown as { name?: string };
      return {
        _id: v._id,
        question: v.question,
        type: v.type,
        options: v.options.map((o) => ({ label: o.label, votes: o.votes })),
        totalVoters: v.ballots?.length ?? 0,
        closed: Date.now() > new Date(v.closeAt).getTime(),
        authorFirstName: author?.firstName ?? null,
        authorRole: author?.role ?? null,
        neighborhoodName: hood?.name ?? null,
      };
    }),
  );
}

export async function publicEvents(_req: Request, res: Response) {
  const events = await Event.find({ isCancelled: { $ne: true } })
    .sort({ date: 1 })
    .limit(8)
    .populate('neighborhoodId', 'name')
    .lean();

  return success(
    res,
    events.map((e) => {
      const hood = e.neighborhoodId as unknown as { name?: string };
      return {
        _id: e._id,
        title: e.title,
        description: e.description?.slice(0, 160) ?? '',
        date: e.date,
        location: e.location,
        participantCount: e.participants?.length ?? 0,
        maxParticipants: e.maxParticipants,
        neighborhoodName: hood?.name ?? null,
      };
    }),
  );
}
