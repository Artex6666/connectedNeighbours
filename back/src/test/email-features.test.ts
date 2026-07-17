import mongoose from 'mongoose';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb, createUser, bearer, TEST_PASSWORD } from './helpers';
import User from '../models/User.model';

const api = () => request(app);

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

describe('Vérification email & accès', () => {
  it('auto-vérifie à l\'inscription quand SMTP est désactivé (login possible)', async () => {
    const body = {
      firstName: 'Eve', lastName: 'Test', email: 'eve@test.com',
      password: 'secret123', phone: '0600000000', address: '1 rue test',
    };
    const reg = await api().post('/api/v1/auth/register').send(body);
    expect(reg.status).toBe(201);
    expect(reg.body.data.isVerified).toBe(true);

    const login = await api().post('/api/v1/auth/login').send({ email: body.email, password: body.password });
    expect(login.status).toBe(200);
  });

  it('refuse le login d\'un compte non vérifié (403)', async () => {
    const user = await createUser({ email: 'unverified@test.com', isVerified: false });
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD });
    expect(res.status).toBe(403);
  });

  it('vérifie un compte via le code reçu', async () => {
    await User.create({
      firstName: 'Tom', lastName: 'Code', email: 'tom@test.com',
      password: await bcrypt.hash(TEST_PASSWORD, 10), phone: '0600000000', address: '1 rue',
      isVerified: false,
      emailVerificationCode: '424242',
      emailVerificationExpires: new Date(Date.now() + 60_000),
    });

    const bad = await api().post('/api/v1/auth/verify-email').send({ email: 'tom@test.com', code: '000000' });
    expect(bad.status).toBe(400);

    const ok = await api().post('/api/v1/auth/verify-email').send({ email: 'tom@test.com', code: '424242' });
    expect(ok.status).toBe(200);

    const login = await api().post('/api/v1/auth/login').send({ email: 'tom@test.com', password: TEST_PASSWORD });
    expect(login.status).toBe(200);
  });
});

describe('Blocage de compte (admin)', () => {
  it('bloque un compte et empêche sa connexion', async () => {
    const admin = await createUser({ role: 'admin' });
    const victim = await createUser({ email: 'victim@test.com' });

    const block = await api()
      .put(`/api/v1/users/${victim._id}/block`)
      .set('Authorization', bearer(admin))
      .send({ blocked: true });
    expect(block.status).toBe(200);
    expect(block.body.data.isBlocked).toBe(true);

    const login = await api()
      .post('/api/v1/auth/login')
      .send({ email: victim.email, password: TEST_PASSWORD });
    expect(login.status).toBe(403);
  });

  it('empêche de se bloquer soi-même (400)', async () => {
    const admin = await createUser({ role: 'admin' });
    const res = await api()
      .put(`/api/v1/users/${admin._id}/block`)
      .set('Authorization', bearer(admin))
      .send({ blocked: true });
    expect(res.status).toBe(400);
  });
});

describe('Préférences email', () => {
  it('met à jour et reflète les préférences', async () => {
    const user = await createUser();
    const res = await api()
      .put('/api/v1/users/me/preferences')
      .set('Authorization', bearer(user))
      .send({ newsletter: false, messages: false });
    expect(res.status).toBe(200);
    expect(res.body.data.newsletter).toBe(false);
    expect(res.body.data.messages).toBe(false);

    const me = await api().get('/api/v1/users/me').set('Authorization', bearer(user));
    expect(me.body.data.emailPreferences.newsletter).toBe(false);
  });
});

describe('Présence (heartbeat)', () => {
  it('marque l\'utilisateur en ligne pour ses voisins', async () => {
    const neighborhoodId = new mongoose.Types.ObjectId();
    const me = await createUser({ neighborhoodId });
    const other = await createUser({ neighborhoodId });

    await api().post('/api/v1/users/heartbeat').set('Authorization', bearer(other));

    const neighbors = await api().get('/api/v1/users/neighbors').set('Authorization', bearer(me));
    const otherEntry = neighbors.body.data.find((u: { _id: string }) => u._id === other._id.toString());
    expect(otherEntry.isOnline).toBe(true);
  });
});

describe('Signalement de message', () => {
  it('signale un message puis le modérateur le voit', async () => {
    const alice = await createUser();
    const bob = await createUser();
    const mod = await createUser({ role: 'moderator' });

    const sent = await api()
      .post(`/api/v1/messages/${bob._id}`)
      .set('Authorization', bearer(alice))
      .send({ content: 'Message limite' });

    const report = await api()
      .post(`/api/v1/messages/${sent.body.data._id}/report`)
      .set('Authorization', bearer(bob))
      .send({ reason: 'Spam' });
    expect(report.status).toBe(201);

    const asResident = await api().get('/api/v1/messages/reports').set('Authorization', bearer(alice));
    expect(asResident.status).toBe(403);

    const reports = await api().get('/api/v1/messages/reports').set('Authorization', bearer(mod));
    expect(reports.status).toBe(200);
    expect(reports.body.data).toHaveLength(1);
  });
});

describe('Newsletter (back-office)', () => {
  it('refuse un habitant (403) et permet le cycle complet à un admin', async () => {
    const resident = await createUser({ role: 'resident' });
    const admin = await createUser({ role: 'admin' });

    const forbidden = await api().get('/api/v1/newsletter').set('Authorization', bearer(resident));
    expect(forbidden.status).toBe(403);

    const created = await api()
      .post('/api/v1/newsletter')
      .set('Authorization', bearer(admin))
      .send({ subject: 'Actus du quartier', contentHtml: '<p>Bonjour</p>' });
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('draft');

    const sent = await api()
      .post(`/api/v1/newsletter/${created.body.data._id}/send`)
      .set('Authorization', bearer(admin));
    expect(sent.status).toBe(200);
    expect(sent.body.data.newsletter.status).toBe('sent');
  });
});
