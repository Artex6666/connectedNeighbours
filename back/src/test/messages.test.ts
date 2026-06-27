import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb, createUser, bearer } from './helpers';

const api = () => request(app);

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

describe('Messagerie privée', () => {
  it('envoie un message texte (201)', async () => {
    const alice = await createUser();
    const bob = await createUser();

    const res = await api()
      .post(`/api/v1/messages/${bob._id}`)
      .set('Authorization', bearer(alice))
      .send({ content: 'Salut Bob' });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('Salut Bob');
    expect(res.body.data.type).toBe('text');
  });

  it('renvoie 400 si le contenu est vide', async () => {
    const alice = await createUser();
    const bob = await createUser();
    const res = await api()
      .post(`/api/v1/messages/${bob._id}`)
      .set('Authorization', bearer(alice))
      .send({});
    expect(res.status).toBe(400);
  });

  it('renvoie 404 si le destinataire n\'existe pas', async () => {
    const alice = await createUser();
    const res = await api()
      .post(`/api/v1/messages/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', bearer(alice))
      .send({ content: 'Hello?' });
    expect(res.status).toBe(404);
  });

  it('récupère la conversation entre deux habitants', async () => {
    const alice = await createUser();
    const bob = await createUser();
    await api()
      .post(`/api/v1/messages/${bob._id}`)
      .set('Authorization', bearer(alice))
      .send({ content: 'Premier' });
    await api()
      .post(`/api/v1/messages/${alice._id}`)
      .set('Authorization', bearer(bob))
      .send({ content: 'Réponse' });

    const res = await api()
      .get(`/api/v1/messages/${bob._id}`)
      .set('Authorization', bearer(alice));
    expect(res.status).toBe(200);
    expect(res.body.data.messages).toHaveLength(2);
    expect(res.body.data.participant.userId).toBe(bob._id.toString());
  });

  it('liste les conversations avec le dernier message', async () => {
    const alice = await createUser();
    const bob = await createUser();
    await api()
      .post(`/api/v1/messages/${bob._id}`)
      .set('Authorization', bearer(alice))
      .send({ content: 'Coucou' });

    const res = await api().get('/api/v1/messages').set('Authorization', bearer(alice));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].userId).toBe(bob._id.toString());
    expect(res.body.data[0].lastMessage).toBe('Coucou');
  });
});

describe('DELETE /messages/:id', () => {
  it('permet à l\'expéditeur de supprimer son message', async () => {
    const alice = await createUser();
    const bob = await createUser();
    const sent = await api()
      .post(`/api/v1/messages/${bob._id}`)
      .set('Authorization', bearer(alice))
      .send({ content: 'À supprimer' });

    const res = await api()
      .delete(`/api/v1/messages/${sent.body.data._id}`)
      .set('Authorization', bearer(alice));
    expect(res.status).toBe(200);
  });

  it('empêche un autre utilisateur de supprimer le message (404)', async () => {
    const alice = await createUser();
    const bob = await createUser();
    const sent = await api()
      .post(`/api/v1/messages/${bob._id}`)
      .set('Authorization', bearer(alice))
      .send({ content: 'Pas touche' });

    const res = await api()
      .delete(`/api/v1/messages/${sent.body.data._id}`)
      .set('Authorization', bearer(bob));
    expect(res.status).toBe(404);
  });
});
