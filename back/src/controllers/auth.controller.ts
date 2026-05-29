import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { success, error } from '../utils/response.utils';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { InvalidCredentialsError, ResourceConflictError } from '../utils/errors';
import User from '../models/User.model';
import Token from '../models/Token.model';

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
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashed,
      phone,
      address,
    });

    return success(
      res,
      {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
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

    const user = await User.findOne({ email });
    if (!user) throw new InvalidCredentialsError();

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new InvalidCredentialsError();

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
    if (err instanceof InvalidCredentialsError) return error(res, 'Invalid credentials', 401);
    return error(res, 'Internal server error', 500);
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

// ─── Verify email (TODO) ─────────────────────────────────────────────────────

export async function verifyEmail(_req: Request, res: Response) {
  return success(res, { message: 'verifyEmail — not implemented' });
}

// ─── MFA (TODO) ──────────────────────────────────────────────────────────────

export async function setupMfa(_req: Request, res: Response) {
  return success(res, { qrCode: null });
}

export async function confirmMfa(_req: Request, res: Response) {
  return success(res, { message: 'confirmMfa — not implemented' });
}
