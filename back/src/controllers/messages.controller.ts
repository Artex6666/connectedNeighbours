import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import Message from '../models/Message.model';
import User from '../models/User.model';
import MessageReport from '../models/MessageReport.model';
import { success, error } from '../utils/response.utils';
import { isOnline } from '../utils/presence';
import { notifyNewMessage } from '../services/email.service';
import { MESSAGE_UPLOAD_PUBLIC_PREFIX } from '../middlewares/upload.middleware';

function createConversationId(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join('__');
}

function createAvatar(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

/**
 * Send the receiver a "new message" email — but only if they are offline AND
 * this is the first unread message of the conversation (one email per
 * interlocutor until they read it). Reading the conversation marks messages as
 * read and re-arms the notification. Never throws.
 */
async function maybeEmailOfflineReceiver(
  receiverId: string,
  senderId: string,
  conversationId: string,
) {
  try {
    const receiver = await User.findById(receiverId).select(
      'email firstName emailPreferences lastSeenAt',
    );
    if (!receiver || isOnline(receiver.lastSeenAt)) return;

    const unread = await Message.countDocuments({ conversationId, receiverId, isRead: false });
    if (unread !== 1) return; // already notified for this batch

    const sender = await User.findById(senderId).select('firstName lastName');
    const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Un voisin';
    await notifyNewMessage(receiver, senderName);
  } catch {
    /* email non bloquant */
  }
}

/**
 * GET /messages — liste les conversations de l'utilisateur : un interlocuteur par
 * ligne avec son dernier message, son statut en ligne et ses initiales d'avatar.
 */
export async function listConversations(req: Request, res: Response) {
  const currentUserId = req.user!._id.toString();
  const messages = await Message.find({
    $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
  })
    .sort({ createdAt: -1 })
    .lean();

  const latestByParticipant = new Map<string, (typeof messages)[number]>();

  for (const message of messages) {
    const senderId = message.senderId.toString();
    const receiverId = message.receiverId.toString();
    const otherUserId = senderId === currentUserId ? receiverId : senderId;

    if (!latestByParticipant.has(otherUserId)) {
      latestByParticipant.set(otherUserId, message);
    }
  }

  const participantIds = [...latestByParticipant.keys()];
  const participants = await User.find({ _id: { $in: participantIds } })
    .select('firstName lastName role lastSeenAt')
    .lean();

  const participantMap = new Map(
    participants.map((participant) => [participant._id.toString(), participant]),
  );

  const conversations = participantIds
    .map((participantId) => {
      const participant = participantMap.get(participantId);
      const latestMessage = latestByParticipant.get(participantId);

      if (!participant || !latestMessage) {
        return null;
      }

      return {
        userId: participant._id.toString(),
        name: `${participant.firstName} ${participant.lastName}`,
        role: participant.role,
        avatar: createAvatar(participant.firstName, participant.lastName),
        isOnline: isOnline(participant.lastSeenAt),
        lastMessage: latestMessage.content,
        lastTimestamp: latestMessage.createdAt,
      };
    })
    .filter((conversation): conversation is NonNullable<typeof conversation> => conversation !== null);

  return success(res, conversations);
}

/**
 * GET /messages/:userId — renvoie la conversation avec un interlocuteur (messages
 * triés du plus ancien au plus récent). L'ouverture marque les messages reçus comme
 * lus, ce qui réarme la notification email. Répond 404 si l'interlocuteur est inconnu.
 */
export async function getConversation(req: Request, res: Response) {
  const currentUserId = req.user!._id.toString();
  const participant = await User.findById(req.params.userId)
    .select('firstName lastName role lastSeenAt')
    .lean();
  if (!participant) {
    return error(res, 'Conversation introuvable', 404);
  }

  const conversationId = createConversationId(currentUserId, req.params.userId);

  // Opening the conversation marks incoming messages as read — this re-arms the
  // offline-email notification for the next batch.
  await Message.updateMany(
    { conversationId, receiverId: currentUserId, isRead: false },
    { $set: { isRead: true } },
  );

  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();

  return success(res, {
    participant: {
      userId: participant._id.toString(),
      name: `${participant.firstName} ${participant.lastName}`,
      role: participant.role,
      avatar: createAvatar(participant.firstName, participant.lastName),
      isOnline: isOnline(participant.lastSeenAt),
    },
    messages: messages.map((message) => ({
      _id: message._id.toString(),
      senderId: message.senderId.toString(),
      receiverId: message.receiverId.toString(),
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    })),
  });
}

/**
 * POST /messages/:userId — envoie un message texte à un autre habitant.
 * Répond 400 si le contenu est vide, 404 si le destinataire est introuvable, 201 sinon.
 * Un email de notification est envoyé si le destinataire est hors ligne.
 */
export async function sendMessage(req: Request, res: Response) {
  const { content, type = 'text' } = req.body;
  if (!content) {
    return error(res, 'Le contenu du message est requis', 400);
  }

  const receiver = await User.findById(req.params.userId).select('_id');
  if (!receiver) {
    return error(res, 'Destinataire introuvable', 404);
  }

  const message = await Message.create({
    senderId: req.user!._id,
    receiverId: receiver._id,
    conversationId: createConversationId(req.user!._id.toString(), receiver._id.toString()),
    content,
    type,
  });

  await maybeEmailOfflineReceiver(
    receiver._id.toString(),
    req.user!._id.toString(),
    message.conversationId,
  );

  return success(
    res,
    {
      _id: message._id.toString(),
      senderId: message.senderId.toString(),
      receiverId: message.receiverId.toString(),
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    },
    201,
  );
}

/**
 * POST /messages/:userId/upload — envoie une pièce jointe (image ou audio) comme message.
 * Le type est déduit du mimetype et doit correspondre au type éventuellement déclaré ;
 * tout fichier refusé est supprimé du disque. Répond 400 (fichier absent/type interdit),
 * 404 (destinataire inconnu) ou 201 avec le message dont le contenu est l'URL publique.
 */
export async function uploadAttachment(req: Request, res: Response) {
  const file = req.file;
  if (!file) {
    return error(res, 'Aucun fichier reçu', 400);
  }

  const declaredType = (req.body.type as string | undefined) ?? '';
  const isImage = file.mimetype.startsWith('image/');
  const isAudio = file.mimetype.startsWith('audio/');
  const type: 'photo' | 'audio' | null = isImage
    ? 'photo'
    : isAudio
      ? 'audio'
      : null;

  if (!type) {
    fs.unlink(file.path, () => undefined);
    return error(res, 'Seuls les fichiers image ou audio sont autorisés', 400);
  }

  // Optional sanity check: if the client declared a type, it must match
  if (declaredType && declaredType !== type) {
    fs.unlink(file.path, () => undefined);
    return error(res, `Type déclaré (${declaredType}) ne correspond pas au fichier (${type})`, 400);
  }

  const receiver = await User.findById(req.params.userId).select('_id');
  if (!receiver) {
    fs.unlink(file.path, () => undefined);
    return error(res, 'Destinataire introuvable', 404);
  }

  const publicUrl = `${MESSAGE_UPLOAD_PUBLIC_PREFIX}/${path.basename(file.path)}`;

  const message = await Message.create({
    senderId: req.user!._id,
    receiverId: receiver._id,
    conversationId: createConversationId(req.user!._id.toString(), receiver._id.toString()),
    content: publicUrl,
    type,
  });

  await maybeEmailOfflineReceiver(
    receiver._id.toString(),
    req.user!._id.toString(),
    message.conversationId,
  );

  return success(
    res,
    {
      _id: message._id.toString(),
      senderId: message.senderId.toString(),
      receiverId: message.receiverId.toString(),
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    },
    201,
  );
}

/**
 * DELETE /messages/:id — supprime un message dont l'utilisateur est l'expéditeur.
 * Répond 404 si le message n'existe pas ou n'a pas été envoyé par l'utilisateur.
 */
export async function deleteMessage(req: Request, res: Response) {
  const deletedMessage = await Message.findOneAndDelete({
    _id: req.params.id,
    senderId: req.user!._id,
  });

  if (!deletedMessage) {
    return error(res, 'Message introuvable', 404);
  }

  return success(res, { message: 'Message supprime' });
}

// ─── Modération ─────────────────────────────────────────────────────────────────

/** Signaler un message (n'importe quel habitant). */
export async function reportMessage(req: Request, res: Response) {
  const message = await Message.findById(req.params.id).select('_id');
  if (!message) return error(res, 'Message introuvable', 404);

  const { reason } = req.body as { reason?: string };
  const report = await MessageReport.create({
    messageId: message._id,
    reportedBy: req.user!._id,
    reason: (reason ?? '').slice(0, 500),
  });

  return success(res, { message: 'Signalement enregistré', reportId: report._id }, 201);
}

/** Lister les signalements en attente (admin/modérateur). */
export async function listReports(_req: Request, res: Response) {
  const reports = await MessageReport.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .populate({ path: 'messageId', select: 'content type senderId receiverId createdAt' })
    .populate('reportedBy', 'firstName lastName')
    .lean();
  return success(res, reports);
}

/** Traiter un signalement : 'reviewed' ou 'dismissed' (admin/modérateur). */
export async function resolveReport(req: Request, res: Response) {
  const { status } = req.body as { status?: string };
  if (status !== 'reviewed' && status !== 'dismissed') {
    return error(res, "status doit être 'reviewed' ou 'dismissed'", 400);
  }
  const report = await MessageReport.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!report) return error(res, 'Signalement introuvable', 404);
  return success(res, report);
}
