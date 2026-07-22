import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_SECRET ?? 'changeme';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'changeme_refresh';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  neighborhoodId?: string;
}

/** Access token — short-lived (15 minutes) */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' } as jwt.SignOptions);
}

/** Refresh token — long-lived (7 days), stored in DB */


export function signRefreshToken(id: string): string {
  return jwt.sign(
    {
      id,
      jti: crypto.randomUUID(),
    },
    REFRESH_SECRET,
    { expiresIn: '7d' } as jwt.SignOptions
  );
}
/**
 * Vérifie la signature et la validité d'un access token.
 * @param token Jeton JWT transmis dans l'en-tête Authorization
 * @returns Le payload décodé (id, email, role, neighborhoodId)
 * @throws Si le jeton est invalide ou expiré
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

/**
 * Vérifie la signature et la validité d'un refresh token.
 * @param token Refresh token envoyé par le client
 * @returns Le payload décodé contenant l'identifiant de l'utilisateur
 * @throws Si le jeton est invalide ou expiré
 */
export function verifyRefreshToken(token: string): { id: string } {
  return jwt.verify(token, REFRESH_SECRET) as { id: string };
}

/** @deprecated Use signAccessToken instead */
export function signToken(payload: JwtPayload): string {
  return signAccessToken(payload);
}
