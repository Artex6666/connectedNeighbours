import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User, { UserRole } from '../models/User.model';
import { signAccessToken } from '../utils/jwt.utils';

/**
 * Integration-test helpers.
 *
 * Tests run against the real MongoDB instance (the same container used by the
 * app) but on a throwaway database, isolated per Jest worker so suites can run
 * in parallel without clobbering each other. Override the target with
 * MONGO_TEST_URI if needed (e.g. in CI).
 */
const workerId = process.env.JEST_WORKER_ID ?? '0';
const TEST_DB_URI =
  process.env.MONGO_TEST_URI ?? `mongodb://127.0.0.1:27017/bobconnect_test_${workerId}`;

export const TEST_PASSWORD = 'password123';

export async function connectTestDb(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
}

/** Wipe every collection between tests so each case starts from a clean slate. */
export async function clearTestDb(): Promise<void> {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export async function disconnectTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

let seq = 0;

type UserOverrides = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  role: UserRole;
  neighborhoodId: mongoose.Types.ObjectId;
  points: number;
}>;

/** Create a persisted user with sensible defaults; password is hashed. */
export async function createUser(overrides: UserOverrides = {}) {
  seq += 1;
  return User.create({
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? `User${seq}`,
    email: overrides.email ?? `user_${workerId}_${seq}@test.com`,
    password: await bcrypt.hash(overrides.password ?? TEST_PASSWORD, 10),
    phone: overrides.phone ?? '0600000000',
    address: overrides.address ?? '1 rue des Tests',
    role: overrides.role ?? 'resident',
    neighborhoodId: overrides.neighborhoodId,
    points: overrides.points ?? 0,
  });
}

type Tokenable = {
  _id: mongoose.Types.ObjectId;
  email: string;
  role: string;
  neighborhoodId?: mongoose.Types.ObjectId | null;
};

/** Sign a valid access token for a user (mirrors what /auth/login issues). */
export function tokenFor(user: Tokenable): string {
  return signAccessToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    neighborhoodId: user.neighborhoodId?.toString(),
  });
}

/** Convenience: the Bearer header value for a user. */
export function bearer(user: Tokenable): string {
  return `Bearer ${tokenFor(user)}`;
}
