import request from 'supertest';
import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb, createUser, TEST_PASSWORD } from './helpers';

const api = () => request(app);

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

const validBody = {
  firstName: 'Alice',
  lastName: 'Martin',
  email: 'alice@test.com',
  password: 'secret123',
  phone: '0612345678',
  address: '5 rue du Quartier',
};

describe('POST /auth/register', () => {
  it('crée un compte et renvoie 201 sans le mot de passe', async () => {
    const res = await api().post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('alice@test.com');
    expect(res.body.data.role).toBe('resident');
    expect(res.body.data.password).toBeUndefined();
  });

  it('renvoie 400 si un champ est manquant', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ ...validBody, email: undefined });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('renvoie 409 si l\'e-mail est déjà utilisé', async () => {
    await api().post('/api/v1/auth/register').send(validBody);
    const res = await api().post('/api/v1/auth/register').send(validBody);
    expect(res.status).toBe(409);
  });
});

describe('POST /auth/login', () => {
  it('renvoie des tokens avec des identifiants valides', async () => {
    const user = await createUser({ email: 'bob@test.com' });

    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('bob@test.com');
  });

  it('renvoie 401 avec un mauvais mot de passe', async () => {
    const user = await createUser({ email: 'bob2@test.com' });
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('renvoie 400 si email ou mot de passe manque', async () => {
    const res = await api().post('/api/v1/auth/login').send({ email: 'x@y.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/refresh & /auth/logout', () => {
  async function loginFresh() {
    const user = await createUser({ email: 'carol@test.com' });
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD });
    return res.body.data.refreshToken as string;
  }

  it('échange un refresh token contre un nouvel access token', async () => {
    const refreshToken = await loginFresh();
    const res = await api().post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it('invalide le refresh token au logout', async () => {
    const refreshToken = await loginFresh();

    const logout = await api().post('/api/v1/auth/logout').send({ refreshToken });
    expect(logout.status).toBe(200);

    // Le token ne doit plus être accepté ensuite
    const after = await api().post('/api/v1/auth/refresh').send({ refreshToken });
    expect(after.status).toBe(401);
  });

  it('renvoie 401 pour un refresh token inconnu', async () => {
    const res = await api().post('/api/v1/auth/refresh').send({ refreshToken: 'nope' });
    expect(res.status).toBe(401);
  });
});

describe('Accès protégé', () => {
  it('renvoie 401 sans header Authorization', async () => {
    const res = await api().get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });
});
