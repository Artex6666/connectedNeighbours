import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb, createUser, bearer } from './helpers';

const api = () => request(app);

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

const NEIGHBORHOOD = new mongoose.Types.ObjectId();

function newEvent(extra: Record<string, unknown> = {}) {
  return {
    title: 'Soirée de quartier',
    description: 'On se retrouve tous',
    date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    location: 'Place centrale',
    maxParticipants: 10,
    ...extra,
  };
}

describe('POST /events', () => {
  it('refuse la création sans quartier (403)', async () => {
    const user = await createUser();
    const res = await api()
      .post('/api/v1/events')
      .set('Authorization', bearer(user))
      .send(newEvent());
    expect(res.status).toBe(403);
  });

  it('crée un événement et ajoute l\'organisateur comme participant', async () => {
    const user = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const res = await api()
      .post('/api/v1/events')
      .set('Authorization', bearer(user))
      .send(newEvent());
    expect(res.status).toBe(201);
    expect(res.body.data.participants).toContain(user._id.toString());
  });
});

describe('Inscription, liste d\'attente et promotion', () => {
  it('place en liste d\'attente quand c\'est complet, puis promeut au désistement', async () => {
    const organizer = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const second = await createUser({ neighborhoodId: NEIGHBORHOOD });

    // maxParticipants = 1 → l'organisateur occupe déjà la seule place
    const created = await api()
      .post('/api/v1/events')
      .set('Authorization', bearer(organizer))
      .send(newEvent({ maxParticipants: 1 }));
    const eventId = created.body.data._id;

    // second s'inscrit → liste d'attente
    const reg = await api()
      .post(`/api/v1/events/${eventId}/register`)
      .set('Authorization', bearer(second));
    expect(reg.status).toBe(200);
    expect(reg.body.data.waitingList.map((u: { _id: string }) => u._id)).toContain(
      second._id.toString(),
    );

    // l'organisateur se désiste → second est promu participant
    const unreg = await api()
      .delete(`/api/v1/events/${eventId}/register`)
      .set('Authorization', bearer(organizer));
    expect(unreg.status).toBe(200);
    expect(unreg.body.data.participants.map((u: { _id: string }) => u._id)).toContain(
      second._id.toString(),
    );
    expect(unreg.body.data.waitingList).toHaveLength(0);
  });

  it('refuse une double inscription (400)', async () => {
    const organizer = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const user = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const created = await api()
      .post('/api/v1/events')
      .set('Authorization', bearer(organizer))
      .send(newEvent());

    await api()
      .post(`/api/v1/events/${created.body.data._id}/register`)
      .set('Authorization', bearer(user));
    const second = await api()
      .post(`/api/v1/events/${created.body.data._id}/register`)
      .set('Authorization', bearer(user));
    expect(second.status).toBe(400);
  });
});

describe('Gestion par l\'organisateur', () => {
  it('seul l\'organisateur peut modifier (403)', async () => {
    const organizer = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const stranger = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const created = await api()
      .post('/api/v1/events')
      .set('Authorization', bearer(organizer))
      .send(newEvent());

    const res = await api()
      .put(`/api/v1/events/${created.body.data._id}`)
      .set('Authorization', bearer(stranger))
      .send({ title: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('annule l\'événement (organisateur)', async () => {
    const organizer = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const created = await api()
      .post('/api/v1/events')
      .set('Authorization', bearer(organizer))
      .send(newEvent());

    const res = await api()
      .delete(`/api/v1/events/${created.body.data._id}`)
      .set('Authorization', bearer(organizer));
    expect(res.status).toBe(200);
  });
});
