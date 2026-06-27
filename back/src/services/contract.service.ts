import path from 'path';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { generateContractPdf, hashFile } from '../utils/pdf.utils';
import { DOCUMENTS_UPLOAD_DIR, DOCUMENT_UPLOAD_PUBLIC_PREFIX } from '../middlewares/upload.middleware';
import DocumentModel from '../models/Document.model';

interface Party {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
}

interface ServiceLike {
  _id: Types.ObjectId;
  title: string;
  description: string;
  points: number;
  neighborhoodId: Types.ObjectId;
}

/**
 * Generate the mandatory contract PDF for a paid service and create a signable
 * Document with both parties as signatories (offerer first, then requester).
 * Returns the created Document.
 */
export async function generateServiceContract(
  service: ServiceLike,
  author: Party,
  requester: Party,
) {
  const fileName = `${Date.now()}-contract-${crypto.randomBytes(8).toString('hex')}.pdf`;
  const physical = path.join(DOCUMENTS_UPLOAD_DIR, fileName);

  await generateContractPdf(physical, {
    offerer: `${author.firstName} ${author.lastName}`,
    requester: `${requester.firstName} ${requester.lastName}`,
    serviceTitle: service.title,
    serviceDescription: service.description,
    points: service.points,
    date: new Date().toLocaleDateString('fr-FR'),
  });

  const doc = await DocumentModel.create({
    title: `Contrat — ${service.title}`,
    fileUrl: `${DOCUMENT_UPLOAD_PUBLIC_PREFIX}/${fileName}`,
    hash: hashFile(physical),
    importerId: author._id,
    neighborhoodId: service.neighborhoodId,
    signatureZones: [
      { signerId: author._id, page: 0, x: 0.1, y: 0.86, width: 0.32, height: 0.06, type: 'signature' },
      { signerId: requester._id, page: 0, x: 0.55, y: 0.86, width: 0.32, height: 0.06, type: 'signature' },
    ],
    signatories: [
      { userId: author._id, order: 1 },
      { userId: requester._id, order: 2 },
    ],
    status: 'pending_signatures',
  });

  return doc;
}
