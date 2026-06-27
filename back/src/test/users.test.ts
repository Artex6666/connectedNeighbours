import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb, createUser, bearer } from './helpers';

const api = () => request(app);

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

describe('GET /users/me', () => {
  it('renvoie le profil courant sans le mot de passe', async () => {
    const user = await createUser();
    const res = await api().get('/api/v1/users/me').set('Authorization', bearer(user));

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(user._id.toString());
    expect(res.body.data.password).toBeUndefined();
  });
});

describe('PUT /users/me', () => {
  it('met à jour les champs autorisés', async () => {
    const user = await createUser();
    const res = await api()
      .put('/api/v1/users/me')
      .set('Authorization', bearer(user))
      .send({ firstName: 'Renamed', role: 'admin' /* doit être ignoré */ });

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('Renamed');
    expect(res.body.data.role).toBe('resident'); // role non modifiable via /me
  });
});

describe('GET /users (liste — admin/modérateur)', () => {
  it('refuse un habitant avec 403', async () => {
    const resident = await createUser({ role: 'resident' });
    const res = await api().get('/api/v1/users').set('Authorization', bearer(resident));
    expect(res.status).toBe(403);
  });

  it('autorise un admin', async () => {
    const admin = await createUser({ role: 'admin' });
    await createUser();
    const res = await api().get('/api/v1/users').set('Authorization', bearer(admin));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });
});

describe('PUT /users/:id/role (admin)', () => {
  it('promeut un habitant en modérateur', async () => {
    const admin = await createUser({ role: 'admin' });
    const resident = await createUser({ role: 'resident' });

    const res = await api()
      .put(`/api/v1/users/${resident._id}/role`)
      .set('Authorization', bearer(admin))
      .send({ role: 'moderator' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('moderator');
  });

  it('empêche un admin de se rétrograder lui-même', async () => {
    const admin = await createUser({ role: 'admin' });
    const res = await api()
      .put(`/api/v1/users/${admin._id}/role`)
      .set('Authorization', bearer(admin))
      .send({ role: 'resident' });
    expect(res.status).toBe(400);
  });

  it('rejette un rôle invalide', async () => {
    const admin = await createUser({ role: 'admin' });
    const resident = await createUser();
    const res = await api()
      .put(`/api/v1/users/${resident._id}/role`)
      .set('Authorization', bearer(admin))
      .send({ role: 'superadmin' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /users/:id (admin)', () => {
  it('supprime un compte existant', async () => {
    const admin = await createUser({ role: 'admin' });
    const victim = await createUser();
    const res = await api()
      .delete(`/api/v1/users/${victim._id}`)
      .set('Authorization', bearer(admin));
    expect(res.status).toBe(200);
  });

  it('renvoie 404 pour un id inconnu', async () => {
    const admin = await createUser({ role: 'admin' });
    const res = await api()
      .delete(`/api/v1/users/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', bearer(admin));
    expect(res.status).toBe(404);
  });
});

describe('GET /users/neighbors', () => {
  it('liste les voisins du même quartier en s\'excluant soi-même', async () => {
    const neighborhoodId = new mongoose.Types.ObjectId();
    const me = await createUser({ neighborhoodId });
    await createUser({ neighborhoodId }); // un voisin
    await createUser({ neighborhoodId: new mongoose.Types.ObjectId() }); // autre quartier

    const res = await api().get('/api/v1/users/neighbors').set('Authorization', bearer(me));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]._id).not.toBe(me._id.toString());
  });
});
