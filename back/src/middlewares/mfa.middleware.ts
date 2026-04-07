import { Request, Response, NextFunction } from 'express';
import { verifyTotpCode } from '../utils/totp.utils';
import { error } from '../utils/response.utils';
import UserModel from '../models/User.model';

export async function mfaMiddleware(req: Request, res: Response, next: NextFunction) {
  const { totpCode } = req.body as { totpCode?: string };

  if (!totpCode) {
    return error(res, 'MFA code required', 403);
  }

  const user = await UserModel.findById(req.user?._id).select('mfaSecret');
  if (!user?.mfaSecret) {
    return error(res, 'MFA not configured for this account', 403);
  }

  const valid = verifyTotpCode(user.mfaSecret, totpCode);
  if (!valid) {
    return error(res, 'Invalid MFA code', 403);
  }

  return next();
}
