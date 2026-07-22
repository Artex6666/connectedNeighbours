import { Response } from 'express';

/**
 * Renvoie une réponse HTTP de succès au format standard `{ success: true, data }`.
 * @param res Réponse Express
 * @param data Charge utile renvoyée au client
 * @param statusCode Code HTTP à utiliser (200 par défaut)
 */
export function success(res: Response, data: unknown, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

/**
 * Renvoie une réponse HTTP d'erreur au format standard `{ success: false, message }`.
 * @param res Réponse Express
 * @param message Message d'erreur destiné au client
 * @param statusCode Code HTTP à utiliser (400 par défaut)
 */
export function error(res: Response, message: string, statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}
