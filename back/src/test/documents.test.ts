import request from 'supertest';
import speakeasy from 'speakeasy';
import { PDFDocument } from 'pdf-lib';
import mongoose from 'mongoose';
import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb, createUser, bearer } from './helpers';
import User from '../models/User.model';

const api = () => request(app);
const NEIGHBORHOOD = new mongoose.Types.ObjectId();

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

async function makePdf(): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.addPage([400, 400]);
  return Buffer.from(await pdf.save());
}

/** Create a signer with MFA enabled; returns the user + a code generator. */
async function signerWithMfa() {
  const secret = speakeasy.generateSecret();
  const user = await createUser({ neighborhoodId: NEIGHBORHOOD });
  await User.findByIdAndUpdate(user._id, { mfaSecret: secret.base32, isMfaEnabled: true });
  return { user, code: () => speakeasy.totp({ secret: secret.base32, encoding: 'base32' }) };
}

describe('Documents & signatures', () => {
  it('flux complet : upload → zones → envoi → signatures ordonnées (MFA) → verrouillage → vérif', async () => {
    const importer = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const a = await signerWithMfa();
    const b = await signerWithMfa();

    // 1. Upload PDF
    const upload = await api()
      .post('/api/v1/documents')
      .set('Authorization', bearer(importer))
      .field('title', 'Bail de location')
      .attach('file', await makePdf(), { filename: 'bail.pdf', contentType: 'application/pdf' });
    expect(upload.status).toBe(201);
    const docId = upload.body.data._id;
    expect(upload.body.data.status).toBe('draft');
    expect(upload.body.data.hash).toEqual(expect.any(String));

    // 2. Zones de signature
    const zones = await api()
      .put(`/api/v1/documents/${docId}/zones`)
      .set('Authorization', bearer(importer))
      .send({
        zones: [
          { signerId: a.user._id, page: 0, x: 0.1, y: 0.8, width: 0.3, height: 0.06 },
          { signerId: b.user._id, page: 0, x: 0.55, y: 0.8, width: 0.3, height: 0.06 },
        ],
      });
    expect(zones.status).toBe(200);

    // 3. Envoi pour signature (ordre a puis b)
    const send = await api()
      .post(`/api/v1/documents/${docId}/send`)
      .set('Authorization', bearer(importer))
      .send({ signatories: [{ userId: a.user._id, order: 1 }, { userId: b.user._id, order: 2 }] });
    expect(send.status).toBe(200);
    expect(send.body.data.status).toBe('pending_signatures');

    // 4. b tente de signer avant son tour → 400
    const outOfOrder = await api()
      .post(`/api/v1/documents/${docId}/sign`)
      .set('Authorization', bearer(b.user))
      .send({ signature: 'B Test', totpCode: b.code() });
    expect(outOfOrder.status).toBe(400);

    // 5. Signature sans MFA → 403
    const noMfa = await api()
      .post(`/api/v1/documents/${docId}/sign`)
      .set('Authorization', bearer(a.user))
      .send({ signature: 'A Test' });
    expect(noMfa.status).toBe(403);

    // 6. a signe (MFA OK) → pas encore verrouillé
    const signA = await api()
      .post(`/api/v1/documents/${docId}/sign`)
      .set('Authorization', bearer(a.user))
      .send({ signature: 'Alice Test', totpCode: a.code() });
    expect(signA.status).toBe(200);
    expect(signA.body.data.status).toBe('pending_signatures');

    // 7. b signe → document signé + verrouillé
    const signB = await api()
      .post(`/api/v1/documents/${docId}/sign`)
      .set('Authorization', bearer(b.user))
      .send({ signature: 'Bob Test', totpCode: b.code() });
    expect(signB.status).toBe(200);
    expect(signB.body.data.status).toBe('signed');
    expect(signB.body.data.locked).toBe(true);
    expect(signB.body.data.signedFileUrl).toMatch(/-signed\.pdf$/);

    // 8. Vérification d'intégrité
    const verify = await api().get(`/api/v1/documents/${docId}/verify`).set('Authorization', bearer(importer));
    expect(verify.status).toBe(200);
    expect(verify.body.data.integrity).toBe('ok');

    // 9. Re-signer → refusé (plus en attente)
    const again = await api()
      .post(`/api/v1/documents/${docId}/sign`)
      .set('Authorization', bearer(a.user))
      .send({ signature: 'x', totpCode: a.code() });
    expect(again.status).toBe(400);
  });

  it('refuse l\'accès à un non-participant', async () => {
    const importer = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const stranger = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const upload = await api()
      .post('/api/v1/documents')
      .set('Authorization', bearer(importer))
      .attach('file', await makePdf(), { filename: 'x.pdf', contentType: 'application/pdf' });

    const res = await api()
      .get(`/api/v1/documents/${upload.body.data._id}`)
      .set('Authorization', bearer(stranger));
    expect(res.status).toBe(403);
  });
});

describe('Contrat auto sur service payant', () => {
  it('génère un contrat signable à l\'acceptation', async () => {
    const author = await createUser({ neighborhoodId: NEIGHBORHOOD });
    const requester = await createUser({ neighborhoodId: NEIGHBORHOOD, points: 10 });

    const created = await api()
      .post('/api/v1/services')
      .set('Authorization', bearer(author))
      .send({ title: 'Cours de guitare', description: '1h de cours', category: 'cours_particuliers', isPaid: true, points: 3 });

    const accept = await api()
      .post(`/api/v1/services/${created.body.data._id}/accept`)
      .set('Authorization', bearer(requester));
    expect(accept.status).toBe(200);
    expect(accept.body.data.contractId).toEqual(expect.any(String));

    // Le contrat apparaît dans les documents du demandeur, à signer
    const docs = await api().get('/api/v1/documents').set('Authorization', bearer(requester));
    expect(docs.body.data.length).toBe(1);
    expect(docs.body.data[0].status).toBe('pending_signatures');
  });
});
