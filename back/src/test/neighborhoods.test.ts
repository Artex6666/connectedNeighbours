import request from 'supertest';
import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb, createUser, bearer } from './helpers';
import Neighborhood from '../models/Neighborhood.model';

const api = () => request(app);

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

// Carrés simples (lng/lat). A et B se chevauchent, C est disjoint.
const squareA = { type: 'Polygon', coordinates: [[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]] };
const squareB = { type: 'Polygon', coordinates: [[[1, 1], [1, 3], [3, 3], [3, 1], [1, 1]]] };
const squareC = { type: 'Polygon', coordinates: [[[10, 10], [10, 12], [12, 12], [12, 10], [10, 10]]] };

describe('POST /neighborhoods (admin)', () => {
  it('refuse un habitant avec 403', async () => {
    const resident = await createUser({ role: 'resident' });
    const res = await api()
      .post('/api/v1/neighborhoods')
      .set('Authorization', bearer(resident))
      .send({ name: 'Centre', polygon: squareA });
    expect(res.status).toBe(403);
  });

  it('crée un quartier valide (201)', async () => {
    const admin = await createUser({ role: 'admin' });
    const res = await api()
      .post('/api/v1/neighborhoods')
      .set('Authorization', bearer(admin))
      .send({ name: 'Centre', description: 'Le centre', polygon: squareA });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Centre');
    expect(res.body.data.polygon.type).toBe('Polygon');
  });

  it('rejette un polygone invalide (400)', async () => {
    const admin = await createUser({ role: 'admin' });
    const res = await api()
      .post('/api/v1/neighborhoods')
      .set('Authorization', bearer(admin))
      .send({ name: 'Bad', polygon: { type: 'Polygon', coordinates: [[[0, 0], [1, 1]]] } });
    expect(res.status).toBe(400);
  });

  it('rejette un quartier qui en chevauche un autre (409)', async () => {
    const admin = await createUser({ role: 'admin' });
    await api()
      .post('/api/v1/neighborhoods')
      .set('Authorization', bearer(admin))
      .send({ name: 'A', polygon: squareA });

    const res = await api()
      .post('/api/v1/neighborhoods')
      .set('Authorization', bearer(admin))
      .send({ name: 'B', polygon: squareB });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/chevauche/i);
  });

  it('autorise deux quartiers disjoints', async () => {
    const admin = await createUser({ role: 'admin' });
    await api()
      .post('/api/v1/neighborhoods')
      .set('Authorization', bearer(admin))
      .send({ name: 'A', polygon: squareA });

    const res = await api()
      .post('/api/v1/neighborhoods')
      .set('Authorization', bearer(admin))
      .send({ name: 'C', polygon: squareC });
    expect(res.status).toBe(201);
  });
});

describe('GET /neighborhoods', () => {
  it('liste les quartiers pour un utilisateur authentifié', async () => {
    const admin = await createUser({ role: 'admin' });
    await Neighborhood.create({
      name: 'A',
      polygon: squareA,
      adminId: admin._id,
    });

    const res = await api().get('/api/v1/neighborhoods').set('Authorization', bearer(admin));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('DELETE /neighborhoods/:id', () => {
  it('refuse la suppression si des habitants sont rattachés (409)', async () => {
    const admin = await createUser({ role: 'admin' });
    const hood = await Neighborhood.create({ name: 'A', polygon: squareA, adminId: admin._id });
    await createUser({ neighborhoodId: hood._id });

    const res = await api()
      .delete(`/api/v1/neighborhoods/${hood._id}`)
      .set('Authorization', bearer(admin));
    expect(res.status).toBe(409);
  });

  it('supprime un quartier sans habitant', async () => {
    const admin = await createUser({ role: 'admin' });
    const hood = await Neighborhood.create({ name: 'A', polygon: squareA, adminId: admin._id });

    const res = await api()
      .delete(`/api/v1/neighborhoods/${hood._id}`)
      .set('Authorization', bearer(admin));
    expect(res.status).toBe(200);
  });
});
