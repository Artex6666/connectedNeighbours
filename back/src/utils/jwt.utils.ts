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


export function signRefreshToken(id: string) {
  return jwt.sign(
    {
      id,
      jti: crypto.randomUUID(),
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { id: string } {
  return jwt.verify(token, REFRESH_SECRET) as { id: string };
}

/** @deprecated Use signAccessToken instead */
export function signToken(payload: JwtPayload): string {
  return signAccessToken(payload);
}
