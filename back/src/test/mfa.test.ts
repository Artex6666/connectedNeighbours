import request from 'supertest';
import speakeasy from 'speakeasy';
import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb, createUser, bearer, TEST_PASSWORD } from './helpers';

const api = () => request(app);

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

function code(secret: string) {
  return speakeasy.totp({ secret, encoding: 'base32' });
}

describe('MFA TOTP', () => {
  it('flux complet : setup → activation → login en deux étapes', async () => {
    const user = await createUser({ email: 'mfa@test.com' });

    // 1. Setup : renvoie un secret + un QR code
    const setup = await api().post('/api/v1/auth/mfa/setup').set('Authorization', bearer(user));
    expect(setup.status).toBe(200);
    const secret = setup.body.data.secret as string;
    expect(secret).toEqual(expect.any(String));
    expect(setup.body.data.qrCode).toMatch(/^data:image\/png/);

    // 2. Activation avec un code valide
    const confirm = await api()
      .post('/api/v1/auth/mfa/verify')
      .set('Authorization', bearer(user))
      .send({ totpCode: code(secret) });
    expect(confirm.status).toBe(200);

    // 3. Login sans code → mfaRequired
    const step1 = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'mfa@test.com', password: TEST_PASSWORD });
    expect(step1.status).toBe(200);
    expect(step1.body.data.mfaRequired).toBe(true);
    expect(step1.body.data.accessToken).toBeUndefined();

    // 4. Login avec code → tokens délivrés
    const step2 = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'mfa@test.com', password: TEST_PASSWORD, totpCode: code(secret) });
    expect(step2.status).toBe(200);
    expect(step2.body.data.accessToken).toEqual(expect.any(String));
  });

  it('refuse le login avec un mauvais code MFA', async () => {
    const user = await createUser({ email: 'mfa2@test.com' });
    const setup = await api().post('/api/v1/auth/mfa/setup').set('Authorization', bearer(user));
    await api()
      .post('/api/v1/auth/mfa/verify')
      .set('Authorization', bearer(user))
      .send({ totpCode: code(setup.body.data.secret) });

    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'mfa2@test.com', password: TEST_PASSWORD, totpCode: '000000' });
    expect(res.status).toBe(401);
  });

  it('désactive la 2FA avec un code valide', async () => {
    const user = await createUser({ email: 'mfa3@test.com' });
    const setup = await api().post('/api/v1/auth/mfa/setup').set('Authorization', bearer(user));
    const secret = setup.body.data.secret as string;
    await api().post('/api/v1/auth/mfa/verify').set('Authorization', bearer(user)).send({ totpCode: code(secret) });

    const disable = await api()
      .post('/api/v1/auth/mfa/disable')
      .set('Authorization', bearer(user))
      .send({ totpCode: code(secret) });
    expect(disable.status).toBe(200);

    // Login redevient simple (pas de code requis)
    const login = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'mfa3@test.com', password: TEST_PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toEqual(expect.any(String));
  });
});
