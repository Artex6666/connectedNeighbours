import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb, createUser, bearer } from './helpers';

const api = () => request(app);
const NB = new mongoose.Types.ObjectId();

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

describe('Votes', () => {
  it('tout habitant crée un vote oui/non et vote', async () => {
    const author = await createUser({ neighborhoodId: NB });
    const voter = await createUser({ neighborhoodId: NB });

    const created = await api()
      .post('/api/v1/votes')
      .set('Authorization', bearer(author))
      .send({ question: 'Nouveau banc au square ?', type: 'yesno', showResultsLive: true });
    expect(created.status).toBe(201);
    expect(created.body.data.options.map((o: { label: string }) => o.label)).toEqual(['Pour', 'Contre']);
    const voteId = created.body.data._id;

    const cast = await api()
      .post(`/api/v1/votes/${voteId}/cast`)
      .set('Authorization', bearer(voter))
      .send({ choice: 0 });
    expect(cast.status).toBe(200);
    expect(cast.body.data.hasVoted).toBe(true);
    expect(cast.body.data.options[0].votes).toBe(1);

    // Double vote refusé
    const again = await api()
      .post(`/api/v1/votes/${voteId}/cast`)
      .set('Authorization', bearer(voter))
      .send({ choice: 1 });
    expect(again.status).toBe(400);
  });

  it('refuse la création sans quartier (403)', async () => {
    const user = await createUser();
    const res = await api()
      .post('/api/v1/votes')
      .set('Authorization', bearer(user))
      .send({ question: 'X', type: 'yesno' });
    expect(res.status).toBe(403);
  });

  it('vote à choix multiple', async () => {
    const author = await createUser({ neighborhoodId: NB });
    const created = await api()
      .post('/api/v1/votes')
      .set('Authorization', bearer(author))
      .send({ question: 'Créneaux ?', type: 'multiple', options: ['Lundi', 'Mardi', 'Mercredi'], showResultsLive: true });
    const id = created.body.data._id;

    const cast = await api()
      .post(`/api/v1/votes/${id}/cast`)
      .set('Authorization', bearer(await createUser({ neighborhoodId: NB })))
      .send({ choices: [0, 2] });
    expect(cast.status).toBe(200);
    expect(cast.body.data.options[0].votes).toBe(1);
    expect(cast.body.data.options[1].votes).toBe(0);
    expect(cast.body.data.options[2].votes).toBe(1);
  });

  it('masque les résultats si non visibles', async () => {
    const author = await createUser({ neighborhoodId: NB });
    const other = await createUser({ neighborhoodId: NB });
    const created = await api()
      .post('/api/v1/votes')
      .set('Authorization', bearer(author))
      .send({ question: 'Secret ?', type: 'yesno', showResultsLive: false });

    // L'autre n'a pas voté → résultats masqués (votes = null)
    const list = await api().get('/api/v1/votes').set('Authorization', bearer(other));
    const v = list.body.data.find((x: { _id: string }) => x._id === created.body.data._id);
    expect(v.resultsVisible).toBe(false);
    expect(v.options[0].votes).toBeNull();
  });
});

describe('Commentaires de vote', () => {
  it('ajoute, liste et modère un commentaire', async () => {
    const author = await createUser({ neighborhoodId: NB });
    const commenter = await createUser({ neighborhoodId: NB });
    const mod = await createUser({ neighborhoodId: NB, role: 'moderator' });

    const created = await api()
      .post('/api/v1/votes')
      .set('Authorization', bearer(author))
      .send({ question: 'Discussion ?', type: 'yesno' });
    const id = created.body.data._id;

    const comment = await api()
      .post(`/api/v1/votes/${id}/comments`)
      .set('Authorization', bearer(commenter))
      .send({ content: 'Bonne idée !' });
    expect(comment.status).toBe(201);
    expect(comment.body.data.author.role).toBe('resident');

    const list = await api().get(`/api/v1/votes/${id}/comments`).set('Authorization', bearer(author));
    expect(list.body.data).toHaveLength(1);

    // Un modérateur peut supprimer le commentaire d'un autre
    const del = await api()
      .delete(`/api/v1/votes/comments/${comment.body.data._id}`)
      .set('Authorization', bearer(mod));
    expect(del.status).toBe(200);
  });

  it('un modérateur peut supprimer un vote', async () => {
    const author = await createUser({ neighborhoodId: NB });
    const mod = await createUser({ neighborhoodId: NB, role: 'moderator' });
    const created = await api()
      .post('/api/v1/votes')
      .set('Authorization', bearer(author))
      .send({ question: 'À supprimer', type: 'yesno' });

    const del = await api()
      .delete(`/api/v1/votes/${created.body.data._id}`)
      .set('Authorization', bearer(mod));
    expect(del.status).toBe(200);
  });
});
