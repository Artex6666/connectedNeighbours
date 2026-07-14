import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { success, error } from '../utils/response.utils';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { InvalidCredentialsError, ResourceConflictError } from '../utils/errors';
import { isMailEnabled } from '../utils/mailer';
import { generateVerificationCode, sendVerificationEmail } from '../services/email.service';
import { generateTotpSecret, generateQrCode, verifyTotpCode } from '../utils/totp.utils';
import User from '../models/User.model';
import Token from '../models/Token.model';
import crypto from 'crypto';

const VERIFICATION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const ssoCodes = new Map<string, {

  userId: string;

  codeChallenge: string;

  expiresAt: number;

}>();

// ─── Register ────────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, password, phone, address } = req.body;

    if (!firstName || !lastName || !email || !password || !phone || !address) {
      return error(res, 'All fields are required', 400);
    }

    const existing = await User.findOne({ email });
    if (existing) throw new ResourceConflictError('Email already in use');

    const hashed = await bcrypt.hash(password, 10);

    // If SMTP isn't configured (dev/test/seed), accounts are auto-verified since
    // no confirmation email can be delivered. In production the user must enter
    // the 6-digit code sent by email before they can log in.
    const mailEnabled = isMailEnabled();
    const code = generateVerificationCode();

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashed,
      phone,
      address,
      isVerified: !mailEnabled,
      emailVerificationCode: mailEnabled ? code : undefined,
      emailVerificationExpires: mailEnabled ? new Date(Date.now() + VERIFICATION_TTL_MS) : undefined,
    });

    if (mailEnabled) {
      const sent = await sendVerificationEmail({ email: user.email, firstName: user.firstName }, code);
      if (!sent) {
        // L'email n'a pas pu être délivré (SMTP indisponible/refusé) — on ne
        // verrouille pas l'utilisateur : le compte est validé directement.
        user.isVerified = true;
        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
      }
    }

    return success(
      res,
      {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        requiresVerification: !user.isVerified,
      },
      201
    );
  } catch (err) {
    if (err instanceof ResourceConflictError) return error(res, err.message, 409);
    return error(res, 'Internal server error', 500);
  }
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) return error(res, 'Email and password are required', 400);

    const { totpCode } = req.body as { totpCode?: string };

    const user = await User.findOne({ email }).select('+mfaSecret');
    if (!user) throw new InvalidCredentialsError();

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new InvalidCredentialsError();

    if (user.isBlocked) {
      return error(res, 'Votre compte a été bloqué. Contactez un administrateur.', 403);
    }
    if (!user.isVerified) {
      return error(res, 'Adresse email non vérifiée. Confirmez votre compte pour vous connecter.', 403);
    }

    // Second facteur (TOTP) si la 2FA est activée sur le compte.
    if (user.isMfaEnabled) {
      if (!totpCode) {
        // Le mot de passe est bon mais il manque le code — le front demande le code.
        return success(res, { mfaRequired: true });
      }
      if (!user.mfaSecret || !verifyTotpCode(user.mfaSecret, totpCode)) {
        return error(res, 'Code de double authentification invalide', 401);
      }
    }

    const accessToken = signAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      neighborhoodId: user.neighborhoodId?.toString(),
    });

    const refreshToken = signRefreshToken(user._id.toString());
    await Token.create({ token: refreshToken, userId: user._id });

    return success(res, {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
 } catch (err) {
   console.error('[LOGIN ERROR]', err);

   if (err instanceof InvalidCredentialsError) {
     return error(res, 'Invalid credentials', 401);
   }

   return error(
     res,
     err instanceof Error ? err.message : 'Internal server error',
     500
   );
 }
}

// ─── Refresh token ───────────────────────────────────────────────────────────

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token is required', 400);

    // Check token exists in DB
    const tokenDoc = await Token.findOne({ token: refreshToken });
    if (!tokenDoc) return error(res, 'Invalid refresh token', 401);

    // Verify signature & expiry
    let payload: { id: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      // Token expired — clean it up
      await Token.deleteOne({ token: refreshToken });
      return error(res, 'Refresh token expired, please login again', 401);
    }

    const user = await User.findById(payload.id);
    if (!user) return error(res, 'User not found', 404);

    const accessToken = signAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return success(res, { accessToken });
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token is required', 400);

    const deleted = await Token.deleteOne({ token: refreshToken });
    if (deleted.deletedCount === 0) return error(res, 'Invalid refresh token', 401);

    return success(res, { message: 'Logged out successfully' });
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── Logout all devices ──────────────────────────────────────────────────────

export async function logoutAll(req: Request, res: Response) {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) return error(res, 'Unauthorized', 401);

    await Token.deleteMany({ userId });

    return success(res, { message: 'Logged out from all devices' });
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── Verify email ────────────────────────────────────────────────────────────

export async function verifyEmail(req: Request, res: Response) {
  try {
    const { email, code } = req.body as { email?: string; code?: string };
    if (!email || !code) return error(res, 'email et code sont requis', 400);

    const user = await User.findOne({ email }).select(
      '+emailVerificationCode +emailVerificationExpires',
    );
    if (!user) return error(res, 'Utilisateur introuvable', 404);
    if (user.isVerified) return success(res, { message: 'Compte déjà vérifié' });

    if (!user.emailVerificationCode || user.emailVerificationCode !== code) {
      return error(res, 'Code de vérification invalide', 400);
    }
    if (user.emailVerificationExpires && user.emailVerificationExpires.getTime() < Date.now()) {
      return error(res, 'Code de vérification expiré, demandez-en un nouveau', 400);
    }

    user.isVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return success(res, { message: 'Compte vérifié avec succès' });
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── Resend verification code ──────────────────────────────────────────────────

export async function resendVerification(req: Request, res: Response) {
  try {
    const { email } = req.body as { email?: string };
    if (!email) return error(res, 'email est requis', 400);

    const user = await User.findOne({ email });
    // Réponse neutre pour ne pas révéler l'existence d'un compte
    if (!user || user.isVerified) {
      return success(res, { message: 'Si le compte existe et n\'est pas vérifié, un email a été envoyé.' });
    }

    if (!isMailEnabled()) {
      user.isVerified = true;
      await user.save();
      return success(res, { message: 'Compte vérifié (email désactivé sur ce serveur).' });
    }

    const code = generateVerificationCode();
    user.emailVerificationCode = code;
    user.emailVerificationExpires = new Date(Date.now() + VERIFICATION_TTL_MS);
    await user.save();
    await sendVerificationEmail({ email: user.email, firstName: user.firstName }, code);

    return success(res, { message: 'Un nouvel email de vérification a été envoyé.' });
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

// ─── MFA (TOTP) ───────────────────────────────────────────────────────────────

/** Étape 1 : génère un secret + QR code à scanner dans une app d'authentification. */
export async function setupMfa(req: Request, res: Response) {
  try {
    const userId = req.user!._id;
    const user = await User.findById(userId).select('email isMfaEnabled');
    if (!user) return error(res, 'Utilisateur introuvable', 404);
    if (user.isMfaEnabled) return error(res, 'La 2FA est déjà activée', 400);

    const secret = generateTotpSecret(user.email);
    // Le secret est stocké en attente ; la 2FA n'est ACTIVE qu'après confirmation.
    await User.findByIdAndUpdate(userId, { mfaSecret: secret.base32 });

    const qrCode = await generateQrCode(secret.otpauth_url ?? '');
    return success(res, { qrCode, secret: secret.base32 });
  } catch {
    return error(res, 'Internal server error', 500);
  }
}

/**
 * Étape 2 : vérifie le code TOTP et active la 2FA.
 * Le code est déjà validé par mfaMiddleware (placé avant ce contrôleur).
 */
export async function confirmMfa(req: Request, res: Response) {
  await User.findByIdAndUpdate(req.user!._id, { isMfaEnabled: true });
  return success(res, { message: 'Double authentification activée', isMfaEnabled: true });
}

/** Désactive la 2FA (nécessite un code TOTP valide via mfaMiddleware). */
export async function disableMfa(req: Request, res: Response) {
  await User.findByIdAndUpdate(req.user!._id, {
    isMfaEnabled: false,
    $unset: { mfaSecret: 1 },
  });
  return success(res, { message: 'Double authentification désactivée', isMfaEnabled: false });
}
/**
 sso*/



 function sha256base64url(value: string) {
   return crypto
     .createHash('sha256')
     .update(value)
     .digest('base64url');
 }

 export async function ssoExchange(req: Request, res: Response) {
   try {
     const { code, codeVerifier } = req.body as {
       code?: string;
       codeVerifier?: string;
     };

     if (!code || !codeVerifier) {
       return error(res, 'code et codeVerifier sont requis', 400);
     }

     const entry = ssoCodes.get(code);
     if (!entry) return error(res, 'Code SSO invalide', 401);

     if (entry.expiresAt < Date.now()) {
       ssoCodes.delete(code);
       return error(res, 'Code SSO expiré', 401);
     }

     const expectedChallenge = sha256base64url(codeVerifier);
     if (expectedChallenge !== entry.codeChallenge) {
       return error(res, 'PKCE invalide', 401);
     }

     ssoCodes.delete(code);

     const user = await User.findById(entry.userId);
     if (!user) return error(res, 'Utilisateur introuvable', 404);

     if (user.isBlocked) return error(res, 'Compte bloqué', 403);

     const accessToken = signAccessToken({
       id: user._id.toString(),
       email: user.email,
       role: user.role,
       neighborhoodId: user.neighborhoodId?.toString(),
     });

     const refreshToken = signRefreshToken(user._id.toString());
     await Token.create({ token: refreshToken, userId: user._id });

     return success(res, {
       accessToken,
       refreshToken,
       user: {
         _id: user._id,
         firstName: user.firstName,
         lastName: user.lastName,
         email: user.email,
         role: user.role,
       },
     });
   } catch (err) {

          console.error('[SSO EXCHANGE ERROR]', err);

          return error(res, 'Internal server error', 500);
 }}

export async function createSsoCode(req: Request, res: Response) {
  try {
    const userId = req.user?._id?.toString();
    const { codeChallenge } = req.body as { codeChallenge?: string };

    if (!userId) return error(res, 'Unauthorized', 401);
    if (!codeChallenge) return error(res, 'codeChallenge requis', 400);

    const code = crypto.randomBytes(32).toString('base64url');

    ssoCodes.set(code, {
      userId,
      codeChallenge,
      expiresAt: Date.now() + 2 * 60 * 1000,
    });

    return success(res, { code });
  } catch (err) {

         console.error('[SSO EXCHANGE ERROR]', err);

         return error(res, 'Internal server error', 500);
         }
}
