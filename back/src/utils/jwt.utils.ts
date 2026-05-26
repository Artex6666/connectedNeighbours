import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET ?? 'changeme';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'changeme_refresh';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/** Access token — short-lived (15 minutes) */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' } as jwt.SignOptions);
}

/** Refresh token — long-lived (7 days), stored in DB */
export function signRefreshToken(userId: string): string {
  return jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: '7d' } as jwt.SignOptions);
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
