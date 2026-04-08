import { Request, Response } from 'express';
import Message from '../models/Message.model';
import User from '../models/User.model';
import { success, error } from '../utils/response.utils';

function createConversationId(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join('__');
}

function createAvatar(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

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
    .select('firstName lastName role')
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
        lastMessage: latestMessage.content,
        lastTimestamp: latestMessage.createdAt,
      };
    })
    .filter((conversation): conversation is NonNullable<typeof conversation> => conversation !== null);

  return success(res, conversations);
}

export async function getConversation(req: Request, res: Response) {
  const currentUserId = req.user!._id.toString();
  const participant = await User.findById(req.params.userId).select('firstName lastName role').lean();
  if (!participant) {
    return error(res, 'Conversation introuvable', 404);
  }

  const conversationId = createConversationId(currentUserId, req.params.userId);
  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();

  return success(res, {
    participant: {
      userId: participant._id.toString(),
      name: `${participant.firstName} ${participant.lastName}`,
      role: participant.role,
      avatar: createAvatar(participant.firstName, participant.lastName),
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
