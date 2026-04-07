import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response.utils';

type Role = 'resident' | 'moderator' | 'admin';

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return error(res, 'Unauthorized', 401);
    }
    if (!roles.includes(req.user.role as Role)) {
      return error(res, 'Forbidden: insufficient permissions', 403);
    }
    return next();
  };
}
