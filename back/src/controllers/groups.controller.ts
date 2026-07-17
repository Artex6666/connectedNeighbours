import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { success, error } from '../utils/response.utils';
import Group from '../models/Group.model';
import GroupMessage from '../models/GroupMessage.model';

type Person = { _id: Types.ObjectId; firstName: string; lastName: string; role: string };
function person(p: unknown) {
  const a = p as Person;
  return a && a.firstName ? { _id: a._id, name: `${a.firstName} ${a.lastName}`, role: a.role } : null;
}

/** Member id whether the array holds raw ObjectIds or populated user docs. */
function memberId(m: unknown): string {
  const obj = m as { _id?: { toString(): string } };
  return obj && obj._id ? obj._id.toString() : String(m);
}

function isMember(group: { members: unknown[] }, userId: string): boolean {
  return group.members.some((m) => memberId(m) === userId);
}

// ─── Liste / création ───────────────────────────────────────────────────────────

export async function listGroups(req: Request, res: Response) {
  const userId = req.user!._id.toString();
  const neighborhoodId = req.user?.neighborhoodId;
  const filter: Record<string, unknown> = {};
  if (neighborhoodId) filter.neighborhoodId = neighborhoodId;

  const groups = await Group.find(filter).sort({ updatedAt: -1 }).populate('createdBy', 'firstName lastName role').lean();
  return success(
    res,
    groups.map((g) => ({
      _id: g._id,
      name: g.name,
      description: g.description,
      memberCount: g.members.length,
      isMember: g.members.some((m) => m.toString() === userId),
      createdBy: person(g.createdBy),
      createdAt: g.createdAt,
    })),
  );
}

export async function createGroup(req: Request, res: Response) {
  const { name, description, memberIds } = req.body as {
    name?: string;
    description?: string;
    memberIds?: string[];
  };
  if (!name || !name.trim()) return error(res, 'Le nom du groupe est requis', 400);

  const neighborhoodId = req.user?.neighborhoodId;
  if (!neighborhoodId) return error(res, 'Vous devez appartenir à un quartier', 403);

  const members = new Set<string>([req.user!._id.toString(), ...(memberIds ?? [])]);
  const group = await Group.create({
    name: name.trim(),
    description: (description ?? '').trim(),
    neighborhoodId,
    createdBy: req.user!._id,
    members: [...members],
  });
  return success(res, group, 201);
}

// ─── Détail + messages (membres) ──────────────────────────────────────────────────

export async function getGroup(req: Request, res: Response) {
  const userId = req.user!._id.toString();
  const group = await Group.findById(req.params.id)
    .populate('members', 'firstName lastName role')
    .populate('createdBy', 'firstName lastName role');
  if (!group) return error(res, 'Groupe introuvable', 404);
  if (!isMember(group, userId)) return error(res, 'Rejoignez le groupe pour voir la discussion', 403);

  const messages = await GroupMessage.find({ groupId: group._id })
    .sort({ createdAt: 1 })
    .populate('senderId', 'firstName lastName role')
    .lean();

  return success(res, {
    _id: group._id,
    name: group.name,
    description: group.description,
    createdBy: person(group.createdBy),
    members: (group.members as unknown[]).map(person).filter(Boolean),
    messages: messages.map((m) => ({
      _id: m._id,
      content: m.content,
      createdAt: m.createdAt,
      sender: person(m.senderId),
    })),
  });
}

export async function sendGroupMessage(req: Request, res: Response) {
  const userId = req.user!._id.toString();
  const { content } = req.body as { content?: string };
  if (!content || !content.trim()) return error(res, 'Message vide', 400);

  const group = await Group.findById(req.params.id).select('members');
  if (!group) return error(res, 'Groupe introuvable', 404);
  if (!isMember(group, userId)) return error(res, 'Vous n\'êtes pas membre de ce groupe', 403);

  const message = await GroupMessage.create({
    groupId: group._id,
    senderId: req.user!._id,
    content: content.trim().slice(0, 2000),
  });
  await Group.findByIdAndUpdate(group._id, { updatedAt: new Date() });
  const populated = await message.populate('senderId', 'firstName lastName role');
  return success(
    res,
    { _id: populated._id, content: populated.content, createdAt: populated.createdAt, sender: person(populated.senderId) },
    201,
  );
}

// ─── Rejoindre / quitter ──────────────────────────────────────────────────────────

export async function joinGroup(req: Request, res: Response) {
  const group = await Group.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { members: req.user!._id } },
    { new: true },
  );
  if (!group) return error(res, 'Groupe introuvable', 404);
  return success(res, { message: 'Groupe rejoint', memberCount: group.members.length });
}

export async function leaveGroup(req: Request, res: Response) {
  const group = await Group.findByIdAndUpdate(
    req.params.id,
    { $pull: { members: req.user!._id } },
    { new: true },
  );
  if (!group) return error(res, 'Groupe introuvable', 404);
  return success(res, { message: 'Groupe quitté' });
}

// ─── Modération ─────────────────────────────────────────────────────────────────

export async function deleteGroup(req: Request, res: Response) {
  const group = await Group.findById(req.params.id);
  if (!group) return error(res, 'Groupe introuvable', 404);

  const userId = req.user!._id.toString();
  const privileged = req.user!.role === 'admin' || req.user!.role === 'moderator';
  if (group.createdBy.toString() !== userId && !privileged) {
    return error(res, 'Seul le créateur ou un modérateur peut supprimer ce groupe', 403);
  }
  await GroupMessage.deleteMany({ groupId: group._id });
  await group.deleteOne();
  return success(res, { message: 'Groupe supprimé' });
}

export async function deleteGroupMessage(req: Request, res: Response) {
  const message = await GroupMessage.findById(req.params.messageId);
  if (!message) return error(res, 'Message introuvable', 404);

  const userId = req.user!._id.toString();
  const privileged = req.user!.role === 'admin' || req.user!.role === 'moderator';
  if (message.senderId.toString() !== userId && !privileged) {
    return error(res, 'Non autorisé', 403);
  }
  await message.deleteOne();
  return success(res, { message: 'Message supprimé' });
}
