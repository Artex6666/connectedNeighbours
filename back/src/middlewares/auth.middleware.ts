import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';
import { error } from '../utils/response.utils';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return error(res, 'Missing or invalid authorization header', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = { _id: payload.id as never, email: payload.email, role: payload.role as never };
    return next();
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }
}
