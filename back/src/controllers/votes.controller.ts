import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { success, error } from '../utils/response.utils';
import Vote, { IVote, VoteType } from '../models/Vote.model';
import VoteComment from '../models/VoteComment.model';

const WEIGHTED_BUDGET = 10; // points à répartir dans un vote pondéré
const VOTE_TYPES: VoteType[] = ['yesno', 'single', 'multiple', 'weighted'];

type PopulatedAuthor = { _id: Types.ObjectId; firstName: string; lastName: string; role: string };

function isOpen(v: IVote): boolean {
  const now = Date.now();
  return now >= v.openAt.getTime() && now <= v.closeAt.getTime();
}

function serializeVote(v: IVote, userId: string, commentsCount = 0) {
  const myBallot = v.ballots.find((b) => b.userId.toString() === userId);
  const hasVoted = Boolean(myBallot);
  const open = isOpen(v);
  const closed = Date.now() > v.closeAt.getTime();
  const resultsVisible = v.showResultsLive || closed || hasVoted;
  const totalVoters = v.ballots.length;

  const author = v.authorId as unknown as PopulatedAuthor;
  return {
    _id: v._id,
    question: v.question,
    type: v.type,
    isAnonymous: v.isAnonymous,
    openAt: v.openAt,
    closeAt: v.closeAt,
    quorum: v.quorum,
    showResultsLive: v.showResultsLive,
    author:
      author && author.firstName
        ? { _id: author._id, name: `${author.firstName} ${author.lastName}`, role: author.role }
        : null,
    options: v.options.map((o) => ({
      label: o.label,
      votes: resultsVisible ? o.votes : null,
    })),
    totalVoters,
    quorumMet: v.quorum ? totalVoters >= v.quorum : true,
    isOpen: open,
    closed,
    resultsVisible,
    hasVoted,
    myChoices: myBallot?.choices ?? [],
    myWeights: myBallot?.weights ?? [],
    commentsCount,
    createdAt: v.createdAt,
  };
}

// ─── List / get ───────────────────────────────────────────────────────────────

/**
 * GET /votes — liste les votes du quartier de l'utilisateur, les plus récents d'abord,
 * avec le nombre de commentaires. Les résultats ne sont exposés que si le vote est en
 * affichage direct, clôturé, ou si l'utilisateur a déjà voté.
 */
export async function listVotes(req: Request, res: Response) {
  try {
    const userId = req.user!._id.toString();
    const neighborhoodId = req.user?.neighborhoodId;
    const filter: Record<string, unknown> = {};
    if (neighborhoodId) filter.neighborhoodId = neighborhoodId;

    const votes = await Vote.find(filter)
      .sort({ createdAt: -1 })
      .populate('authorId', 'firstName lastName role');

    const ids = votes.map((v) => v._id);
    const counts = await VoteComment.aggregate([
      { $match: { voteId: { $in: ids } } },
      { $group: { _id: '$voteId', n: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id.toString(), c.n as number]));

    return success(
      res,
      votes.map((v) => serializeVote(v, userId, countMap.get(v._id.toString()) ?? 0)),
    );
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

/**
 * GET /votes/:id — détail d'un vote (options, quorum, dates, mon bulletin, résultats
 * si visibles) et nombre de commentaires. Répond 404 si le vote est introuvable.
 */
export async function getVote(req: Request, res: Response) {
  try {
    const userId = req.user!._id.toString();
    const vote = await Vote.findById(req.params.id).populate('authorId', 'firstName lastName role');
    if (!vote) return error(res, 'Vote introuvable', 404);
    const commentsCount = await VoteComment.countDocuments({ voteId: vote._id });
    return success(res, serializeVote(vote, userId, commentsCount));
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── Create (ouvert à tous les habitants) ────────────────────────────────────────

/**
 * POST /votes — crée un vote, ouvert à tous les habitants d'un quartier.
 * Le type doit être yesno, single, multiple ou weighted ; un vote yesno génère
 * automatiquement les options Pour/Contre, les autres exigent au moins 2 options.
 * Par défaut le vote ouvre immédiatement et se clôture 7 jours plus tard.
 * Répond 400 (question, type, options ou dates invalides) ou 403 (aucun quartier).
 */
export async function createVote(req: Request, res: Response) {
  try {
    const { question, type, options, isAnonymous, openAt, closeAt, quorum, showResultsLive } =
      req.body as {
        question?: string;
        type?: VoteType;
        options?: string[];
        isAnonymous?: boolean;
        openAt?: string;
        closeAt?: string;
        quorum?: number;
        showResultsLive?: boolean;
      };

    if (!question || !question.trim()) return error(res, 'La question est requise', 400);
    if (!type || !VOTE_TYPES.includes(type)) {
      return error(res, `type doit être : ${VOTE_TYPES.join(', ')}`, 400);
    }

    const neighborhoodId = req.user?.neighborhoodId;
    if (!neighborhoodId) {
      return error(res, 'Vous devez appartenir à un quartier pour créer un vote', 403);
    }

    let opts: { label: string; votes: number }[];
    if (type === 'yesno') {
      opts = [
        { label: 'Pour', votes: 0 },
        { label: 'Contre', votes: 0 },
      ];
    } else {
      if (!Array.isArray(options) || options.filter((o) => o && o.trim()).length < 2) {
        return error(res, 'Au moins 2 options sont requises', 400);
      }
      opts = options
        .filter((o) => o && o.trim())
        .map((label) => ({ label: label.trim().slice(0, 200), votes: 0 }));
    }

    const now = new Date();
    const open = openAt ? new Date(openAt) : now;
    const close = closeAt ? new Date(closeAt) : new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    if (Number.isNaN(open.getTime()) || Number.isNaN(close.getTime()) || close <= open) {
      return error(res, 'Dates invalides (clôture après ouverture)', 400);
    }

    const vote = await Vote.create({
      question: question.trim(),
      type,
      options: opts,
      authorId: req.user!._id,
      neighborhoodId,
      isAnonymous: Boolean(isAnonymous),
      openAt: open,
      closeAt: close,
      quorum: quorum && quorum > 0 ? quorum : undefined,
      showResultsLive: Boolean(showResultsLive),
    });

    const populated = await vote.populate('authorId', 'firstName lastName role');
    return success(res, serializeVote(populated, req.user!._id.toString(), 0), 201);
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── Voter ────────────────────────────────────────────────────────────────────

/**
 * POST /votes/:id/cast — enregistre le bulletin de l'utilisateur (un seul par personne).
 * Refuse un vote pas encore ouvert, clôturé ou déjà exprimé (400). Selon le type :
 * `choice` (yesno/single), `choices` (multiple) ou `weights` répartissant exactement
 * 10 points (weighted). Les compteurs d'options sont incrémentés en conséquence.
 */
export async function castVote(req: Request, res: Response) {
  try {
    const userId = req.user!._id.toString();
    const vote = await Vote.findById(req.params.id);
    if (!vote) return error(res, 'Vote introuvable', 404);

    const now = Date.now();
    if (now < vote.openAt.getTime()) return error(res, "Le vote n'est pas encore ouvert", 400);
    if (now > vote.closeAt.getTime()) return error(res, 'Le vote est clôturé', 400);
    if (vote.ballots.some((b) => b.userId.toString() === userId)) {
      return error(res, 'Vous avez déjà voté', 400);
    }

    let choices: number[] = [];
    let weights: number[] = [];

    if (vote.type === 'yesno' || vote.type === 'single') {
      const idx = Number(req.body.choice);
      if (!Number.isInteger(idx) || idx < 0 || idx >= vote.options.length) {
        return error(res, 'Choix invalide', 400);
      }
      choices = [idx];
      vote.options[idx].votes += 1;
    } else if (vote.type === 'multiple') {
      const raw: number[] = Array.isArray(req.body.choices)
        ? (req.body.choices as unknown[]).map((x) => Number(x))
        : [];
      const valid: number[] = [...new Set(raw)].filter(
        (i) => Number.isInteger(i) && i >= 0 && i < vote.options.length,
      );
      if (valid.length === 0) return error(res, 'Au moins un choix est requis', 400);
      choices = valid;
      valid.forEach((i) => (vote.options[i].votes += 1));
    } else {
      // weighted
      const w: number[] = Array.isArray(req.body.weights)
        ? (req.body.weights as unknown[]).map((x) => Number(x))
        : [];
      if (w.length !== vote.options.length || w.some((x) => !Number.isFinite(x) || x < 0)) {
        return error(res, 'weights invalide', 400);
      }
      const sum = w.reduce((a, b) => a + b, 0);
      if (sum !== WEIGHTED_BUDGET) {
        return error(res, `Répartissez exactement ${WEIGHTED_BUDGET} points`, 400);
      }
      weights = w;
      w.forEach((x, i) => (vote.options[i].votes += x));
    }

    vote.ballots.push({ userId: req.user!._id as never, choices, weights });
    vote.voters.push(req.user!._id as never);
    await vote.save();

    const populated = await vote.populate('authorId', 'firstName lastName role');
    return success(res, serializeVote(populated, userId));
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── Supprimer (auteur, modérateur ou admin) ─────────────────────────────────────

/**
 * DELETE /votes/:id — supprime un vote ainsi que tous ses commentaires.
 * Réservé à l'auteur, à un modérateur ou à un admin (403).
 */
export async function deleteVote(req: Request, res: Response) {
  try {
    const vote = await Vote.findById(req.params.id);
    if (!vote) return error(res, 'Vote introuvable', 404);

    const userId = req.user!._id.toString();
    const role = req.user!.role;
    const isPrivileged = role === 'admin' || role === 'moderator';
    if (vote.authorId.toString() !== userId && !isPrivileged) {
      return error(res, "Seul l'auteur ou un modérateur peut supprimer ce vote", 403);
    }

    await VoteComment.deleteMany({ voteId: vote._id });
    await vote.deleteOne();
    return success(res, { message: 'Vote supprimé' });
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── Commentaires ────────────────────────────────────────────────────────────────

/**
 * GET /votes/:id/comments — liste les commentaires d'un vote, du plus ancien au plus
 * récent, avec le nom et le rôle de leur auteur.
 */
export async function listComments(req: Request, res: Response) {
  const comments = await VoteComment.find({ voteId: req.params.id })
    .sort({ createdAt: 1 })
    .populate('authorId', 'firstName lastName role')
    .lean();
  return success(
    res,
    comments.map((c) => {
      const a = c.authorId as unknown as PopulatedAuthor;
      return {
        _id: c._id,
        content: c.content,
        createdAt: c.createdAt,
        author: a ? { _id: a._id, name: `${a.firstName} ${a.lastName}`, role: a.role } : null,
      };
    }),
  );
}

/**
 * POST /votes/:id/comments — ajoute un commentaire à un vote (tronqué à 1000 caractères).
 * Répond 400 si le commentaire est vide, 404 si le vote est introuvable, 201 sinon.
 */
export async function addComment(req: Request, res: Response) {
  const { content } = req.body as { content?: string };
  if (!content || !content.trim()) return error(res, 'Le commentaire est vide', 400);

  const vote = await Vote.findById(req.params.id).select('_id');
  if (!vote) return error(res, 'Vote introuvable', 404);

  const comment = await VoteComment.create({
    voteId: vote._id,
    authorId: req.user!._id,
    content: content.trim().slice(0, 1000),
  });
  const populated = await comment.populate('authorId', 'firstName lastName role');
  const a = populated.authorId as unknown as PopulatedAuthor;
  return success(
    res,
    {
      _id: populated._id,
      content: populated.content,
      createdAt: populated.createdAt,
      author: { _id: a._id, name: `${a.firstName} ${a.lastName}`, role: a.role },
    },
    201,
  );
}

/**
 * DELETE /votes/comments/:commentId — supprime un commentaire.
 * Réservé à l'auteur, à un modérateur ou à un admin (403).
 */
export async function deleteComment(req: Request, res: Response) {
  const comment = await VoteComment.findById(req.params.commentId);
  if (!comment) return error(res, 'Commentaire introuvable', 404);

  const userId = req.user!._id.toString();
  const role = req.user!.role;
  const isPrivileged = role === 'admin' || role === 'moderator';
  if (comment.authorId.toString() !== userId && !isPrivileged) {
    return error(res, "Seul l'auteur ou un modérateur peut supprimer ce commentaire", 403);
  }
  await comment.deleteOne();
  return success(res, { message: 'Commentaire supprimé' });
}
