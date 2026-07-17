import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb, createUser, bearer } from './helpers';

const api = () => request(app);
const NB = new mongoose.Types.ObjectId();

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

describe('Groupes de discussion', () => {
  it('création, adhésion, messages et accès membres', async () => {
    const creator = await createUser({ neighborhoodId: NB });
    const other = await createUser({ neighborhoodId: NB });

    const created = await api()
      .post('/api/v1/groups')
      .set('Authorization', bearer(creator))
      .send({ name: 'Fête des voisins', description: 'Organisation' });
    expect(created.status).toBe(201);
    const groupId = created.body.data._id;

    // Non-membre : accès refusé
    const denied = await api().get(`/api/v1/groups/${groupId}`).set('Authorization', bearer(other));
    expect(denied.status).toBe(403);

    // Rejoindre
    const join = await api().post(`/api/v1/groups/${groupId}/join`).set('Authorization', bearer(other));
    expect(join.status).toBe(200);

    // Envoyer un message (membre)
    const msg = await api()
      .post(`/api/v1/groups/${groupId}/messages`)
      .set('Authorization', bearer(other))
      .send({ content: 'Salut tout le monde !' });
    expect(msg.status).toBe(201);
    expect(msg.body.data.sender.role).toBe('resident');

    // Détail avec messages
    const detail = await api().get(`/api/v1/groups/${groupId}`).set('Authorization', bearer(creator));
    expect(detail.status).toBe(200);
    expect(detail.body.data.messages).toHaveLength(1);
    expect(detail.body.data.members.length).toBe(2);
  });

  it('un non-membre ne peut pas écrire (403)', async () => {
    const creator = await createUser({ neighborhoodId: NB });
    const stranger = await createUser({ neighborhoodId: NB });
    const created = await api()
      .post('/api/v1/groups')
      .set('Authorization', bearer(creator))
      .send({ name: 'Privé' });

    const res = await api()
      .post(`/api/v1/groups/${created.body.data._id}/messages`)
      .set('Authorization', bearer(stranger))
      .send({ content: 'coucou' });
    expect(res.status).toBe(403);
  });

  it('un modérateur peut supprimer un groupe', async () => {
    const creator = await createUser({ neighborhoodId: NB });
    const mod = await createUser({ neighborhoodId: NB, role: 'moderator' });
    const created = await api()
      .post('/api/v1/groups')
      .set('Authorization', bearer(creator))
      .send({ name: 'À supprimer' });

    const del = await api().delete(`/api/v1/groups/${created.body.data._id}`).set('Authorization', bearer(mod));
    expect(del.status).toBe(200);
  });
});
