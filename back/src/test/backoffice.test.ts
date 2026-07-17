import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb, createUser, bearer } from './helpers';

const api = () => request(app);

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

// Ces contrôleurs renvoient le document brut (pas l'enveloppe { success, data }).
describe('Incidents (admin / modérateur)', () => {
  it('refuse un habitant (403)', async () => {
    const resident = await createUser({ role: 'resident' });
    const res = await api().get('/api/v1/incidents').set('Authorization', bearer(resident));
    expect(res.status).toBe(403);
  });

  it('crée, liste et met à jour le statut d\'un incident', async () => {
    const mod = await createUser({ role: 'moderator' });

    const created = await api()
      .post('/api/v1/incidents')
      .set('Authorization', bearer(mod))
      .send({ title: 'Lampadaire cassé', description: 'Rue des Lilas', priority: 'high' });
    expect(created.status).toBe(201);
    expect(created.body.title).toBe('Lampadaire cassé');
    expect(created.body.status).toBe('open');

    const list = await api().get('/api/v1/incidents').set('Authorization', bearer(mod));
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);

    const updated = await api()
      .put(`/api/v1/incidents/${created.body._id}`)
      .set('Authorization', bearer(mod))
      .send({ status: 'resolved' });
    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe('resolved');
  });

  it('seul un admin peut supprimer (modérateur → 403, admin → 200)', async () => {
    const mod = await createUser({ role: 'moderator' });
    const admin = await createUser({ role: 'admin' });

    const created = await api()
      .post('/api/v1/incidents')
      .set('Authorization', bearer(mod))
      .send({ title: 'X', description: 'Y' });

    const asMod = await api()
      .delete(`/api/v1/incidents/${created.body._id}`)
      .set('Authorization', bearer(mod));
    expect(asMod.status).toBe(403);

    const asAdmin = await api()
      .delete(`/api/v1/incidents/${created.body._id}`)
      .set('Authorization', bearer(admin));
    expect(asAdmin.status).toBe(200);
  });

  it('renvoie 404 pour un incident inconnu', async () => {
    const mod = await createUser({ role: 'moderator' });
    const res = await api()
      .get(`/api/v1/incidents/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', bearer(mod));
    expect(res.status).toBe(404);
  });
});

describe('Alertes (admin / modérateur)', () => {
  it('crée et liste une alerte', async () => {
    const admin = await createUser({ role: 'admin' });
    const created = await api()
      .post('/api/v1/alertes')
      .set('Authorization', bearer(admin))
      .send({ title: 'Coupure d\'eau', message: 'Demain 8h-12h', level: 'warning' });
    expect(created.status).toBe(201);
    expect(created.body.active).toBe(true);

    const list = await api().get('/api/v1/alertes').set('Authorization', bearer(admin));
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });
});

describe('GET /stats/dashboard', () => {
  it('refuse un habitant (403)', async () => {
    const resident = await createUser({ role: 'resident' });
    const res = await api().get('/api/v1/stats/dashboard').set('Authorization', bearer(resident));
    expect(res.status).toBe(403);
  });

  it('agrège les compteurs incidents et alertes', async () => {
    const admin = await createUser({ role: 'admin' });
    await api()
      .post('/api/v1/incidents')
      .set('Authorization', bearer(admin))
      .send({ title: 'A', description: 'a' });
    await api()
      .post('/api/v1/alertes')
      .set('Authorization', bearer(admin))
      .send({ title: 'B', message: 'b' });

    const res = await api().get('/api/v1/stats/dashboard').set('Authorization', bearer(admin));
    expect(res.status).toBe(200);
    expect(res.body.incidents.total).toBe(1);
    expect(res.body.incidents.ouverts).toBe(1);
    expect(res.body.alertes.total).toBe(1);
    expect(res.body.alertes.actives).toBe(1);
  });
});
