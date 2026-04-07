import { Request, Response } from 'express';
import { success } from '../utils/response.utils';

export async function listConversations(_req: Request, res: Response) {
  // TODO: retourner la liste des conversations de l'utilisateur (dernier message par conversation)
  return success(res, []);
}

export async function getConversation(_req: Request, res: Response) {
  // TODO: retourner les messages entre req.user et :userId (paginés)
  return success(res, []);
}

export async function sendMessage(_req: Request, res: Response) {
  // TODO: créer un message, émettre via Socket.IO
  return success(res, null, 201);
}

export async function deleteMessage(_req: Request, res: Response) {
  // TODO: supprimer un message (expéditeur uniquement)
  return success(res, { message: 'deleteMessage — not implemented' });
}
