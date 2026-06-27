import request from 'supertest';
import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb, createUser, bearer, TEST_PASSWORD } from './helpers';
import User from '../models/User.model';

const api = () => request(app);

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

describe('RGPD — export des données', () => {
  it('exporte les données personnelles en JSON (téléchargeable)', async () => {
    const user = await createUser({ email: 'export@test.com' });
    const res = await api().get('/api/v1/users/me/export').set('Authorization', bearer(user));

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/\.json/);
    expect(res.body.profile.email).toBe('export@test.com');
    expect(res.body.profile.password).toBeUndefined();
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(Array.isArray(res.body.services)).toBe(true);
  });

  it('exporte en CSV', async () => {
    const user = await createUser();
    const res = await api()
      .get('/api/v1/users/me/export?format=csv')
      .set('Authorization', bearer(user));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/csv/);
    expect(res.text).toContain('# Profil');
  });
});

describe('RGPD — suppression / anonymisation', () => {
  it('anonymise le compte et empêche toute reconnexion', async () => {
    const user = await createUser({ email: 'todelete@test.com' });

    const del = await api().delete('/api/v1/users/me').set('Authorization', bearer(user));
    expect(del.status).toBe(200);

    const inDb = await User.findById(user._id);
    expect(inDb?.firstName).toBe('Compte');
    expect(inDb?.lastName).toBe('supprimé');
    expect(inDb?.email).not.toBe('todelete@test.com');
    expect(inDb?.isBlocked).toBe(true);

    // L'email d'origine n'existe plus → connexion impossible
    const login = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'todelete@test.com', password: TEST_PASSWORD });
    expect(login.status).toBe(401);
  });
});
