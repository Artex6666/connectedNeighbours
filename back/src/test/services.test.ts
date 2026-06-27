import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb, createUser, bearer } from './helpers';
import User from '../models/User.model';

const api = () => request(app);

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

const NEIGHBORHOOD = new mongoose.Types.ObjectId();

function newService(extra: Record<string, unknown> = {}) {
  return {
    title: 'Tonte de pelouse',
    description: 'Je tonds votre pelouse',
    category: 'jardinage',
    ...extra,
  };
}

describe('POST /services', () => {
  it('refuse la création sans quartier (403)', async () => {
    const user = await createUser(); // pas de neighborhoodId
    const res = await api()
      .post('/api/v1/services')
      .set('Authorization', bearer(user))
      .send(newService());
    expect(res.status).toBe(403);
  });

  it('crée une annonce dans le quartier de l\'auteur (201)', async () => {
    const user = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const res = await api()
      .post('/api/v1/services')
      .set('Authorization', bearer(user))
      .send(newService());
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('open');
    expect(res.body.data.category).toBe('jardinage');
  });

  it('renvoie 400 si un champ requis manque', async () => {
    const user = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const res = await api()
      .post('/api/v1/services')
      .set('Authorization', bearer(user))
      .send({ title: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('GET /services', () => {
  it('ne renvoie que les annonces du quartier de l\'utilisateur', async () => {
    const a = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const other = await createUser({ neighborhoodId: new mongoose.Types.ObjectId() });

    await api().post('/api/v1/services').set('Authorization', bearer(a)).send(newService());
    await api()
      .post('/api/v1/services')
      .set('Authorization', bearer(other))
      .send(newService({ title: 'Autre quartier' }));

    const res = await api().get('/api/v1/services').set('Authorization', bearer(a));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Tonte de pelouse');
  });
});

describe('Cycle d\'un service payant (système de points)', () => {
  it('bloque les points à l\'acceptation puis les transfère à la complétion', async () => {
    const author = await createUser({ neighborhoodId: NEIGHBORHOOD, points: 0 });
    const requester = await createUser({ neighborhoodId: NEIGHBORHOOD, points: 10 });

    const created = await api()
      .post('/api/v1/services')
      .set('Authorization', bearer(author))
      .send(newService({ isPaid: true, points: 4 }));
    const serviceId = created.body.data._id;

    // Acceptation par le demandeur → points bloqués (déduits)
    const accept = await api()
      .post(`/api/v1/services/${serviceId}/accept`)
      .set('Authorization', bearer(requester));
    expect(accept.status).toBe(200);
    expect(accept.body.data.status).toBe('in_progress');

    const requesterAfterAccept = await User.findById(requester._id);
    expect(requesterAfterAccept?.points).toBe(6); // 10 - 4

    // Complétion par l'auteur → transfert des points
    const complete = await api()
      .post(`/api/v1/services/${serviceId}/complete`)
      .set('Authorization', bearer(author));
    expect(complete.status).toBe(200);
    expect(complete.body.data.status).toBe('done');

    const authorAfter = await User.findById(author._id);
    expect(authorAfter?.points).toBe(4); // 0 + 4
  });

  it('refuse l\'acceptation si le demandeur n\'a pas assez de points (400)', async () => {
    const author = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const poor = await createUser({ neighborhoodId: NEIGHBORHOOD, points: 1 });

    const created = await api()
      .post('/api/v1/services')
      .set('Authorization', bearer(author))
      .send(newService({ isPaid: true, points: 4 }));

    const res = await api()
      .post(`/api/v1/services/${created.body.data._id}/accept`)
      .set('Authorization', bearer(poor));
    expect(res.status).toBe(400);
  });
});

describe('Règles d\'accès des services', () => {
  it('interdit d\'accepter sa propre annonce (400)', async () => {
    const author = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const created = await api()
      .post('/api/v1/services')
      .set('Authorization', bearer(author))
      .send(newService());

    const res = await api()
      .post(`/api/v1/services/${created.body.data._id}/accept`)
      .set('Authorization', bearer(author));
    expect(res.status).toBe(400);
  });

  it('seul l\'auteur peut compléter (403)', async () => {
    const author = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const requester = await createUser({ neighborhoodId: NEIGHBORHOOD });

    const created = await api()
      .post('/api/v1/services')
      .set('Authorization', bearer(author))
      .send(newService());
    await api()
      .post(`/api/v1/services/${created.body.data._id}/accept`)
      .set('Authorization', bearer(requester));

    const res = await api()
      .post(`/api/v1/services/${created.body.data._id}/complete`)
      .set('Authorization', bearer(requester));
    expect(res.status).toBe(403);
  });
});
