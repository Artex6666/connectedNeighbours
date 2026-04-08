import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { success, error } from '../utils/response.utils';
import { signToken } from '../utils/jwt.utils';
import User from '../models/User.model';
import { isInMemoryMode } from '../config/runtime';
import {
  createInMemoryUser,
  findInMemoryUserByEmail,
  toPublicUser,
} from '../dev/in-memory-store';

export async function register(req: Request, res: Response) {
  const { firstName, lastName, email, password, phone, address } = req.body;

  if (!firstName || !lastName || !email || !password || !phone || !address) {
    return error(res, 'Tous les champs sont requis', 400);
  }

  if (isInMemoryMode()) {
    const existingUser = findInMemoryUserByEmail(email);
    if (existingUser) {
      return error(res, 'Email déjà utilisé', 409);
    }

    const user = await createInMemoryUser({
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
    });

    return success(res, user, 201);
  }

  const existing = await User.findOne({ email });
  if (existing) return error(res, 'Email déjà utilisé', 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ firstName, lastName, email, password: hashed, phone, address });

  return success(res, {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  }, 201);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) return error(res, 'Email et mot de passe requis', 400);

  if (isInMemoryMode()) {
    const user = findInMemoryUserByEmail(email);
    if (!user) {
      return error(res, 'Identifiants invalides', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return error(res, 'Identifiants invalides', 401);
    }

    const token = signToken({ id: user._id, email: user.email, role: user.role });

    return success(res, {
      token,
      user: toPublicUser(user),
    });
  }

  const user = await User.findOne({ email });
  if (!user) return error(res, 'Identifiants invalides', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return error(res, 'Identifiants invalides', 401);

  const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });

  return success(res, {
    token,
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  });
}

export async function verifyEmail(_req: Request, res: Response) {
  // TODO: vérifier le code reçu par email, passer isVerified à true
  return success(res, { message: 'verifyEmail — not implemented' });
}

export async function setupMfa(_req: Request, res: Response) {
  // TODO: générer secret TOTP, retourner QR code
  return success(res, { qrCode: null });
}

export async function confirmMfa(_req: Request, res: Response) {
  // TODO: activer isMfaEnabled = true sur l'utilisateur
  return success(res, { message: 'confirmMfa — not implemented' });
}
