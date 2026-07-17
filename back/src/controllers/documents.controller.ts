import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { success, error } from '../utils/response.utils';
import { hashFile, stampSignatures, type ZoneToStamp, type StampSignature } from '../utils/pdf.utils';
import { sendMail, appUrl } from '../utils/mailer';
import {
  DOCUMENT_UPLOAD_PUBLIC_PREFIX,
  DOCUMENTS_UPLOAD_DIR,
} from '../middlewares/upload.middleware';
import DocumentModel from '../models/Document.model';
import User from '../models/User.model';

function physicalPath(fileUrl: string): string {
  return path.join(process.cwd(), fileUrl);
}

function canAccess(
  doc: { importerId: { toString(): string }; signatories: { userId: { toString(): string } }[] },
  userId: string,
): boolean {
  if (doc.importerId.toString() === userId) return true;
  return doc.signatories.some((s) => s.userId.toString() === userId);
}

// ─── List / get ───────────────────────────────────────────────────────────────

export async function listDocuments(req: Request, res: Response) {
  const userId = req.user!._id;
  const docs = await DocumentModel.find({
    $or: [{ importerId: userId }, { 'signatories.userId': userId }],
  })
    .sort({ createdAt: -1 })
    .populate('importerId', 'firstName lastName')
    .populate('signatories.userId', 'firstName lastName')
    .lean();
  return success(res, docs);
}

export async function getDocument(req: Request, res: Response) {
  const userId = req.user!._id.toString();
  const doc = await DocumentModel.findById(req.params.id)
    .populate('importerId', 'firstName lastName')
    .populate('signatories.userId', 'firstName lastName');
  if (!doc) return error(res, 'Document introuvable', 404);
  if (!canAccess(doc, userId)) return error(res, 'Accès refusé', 403);
  return success(res, doc);
}

// ─── Upload PDF ─────────────────────────────────────────────────────────────────

export async function uploadDocument(req: Request, res: Response) {
  const file = req.file;
  if (!file) return error(res, 'Aucun fichier PDF reçu', 400);

  const neighborhoodId = req.user?.neighborhoodId;
  if (!neighborhoodId) {
    fs.unlink(file.path, () => undefined);
    return error(res, 'Vous devez appartenir à un quartier pour importer un document', 403);
  }

  const fileUrl = `${DOCUMENT_UPLOAD_PUBLIC_PREFIX}/${path.basename(file.path)}`;
  const hash = hashFile(file.path);

  const doc = await DocumentModel.create({
    title: (req.body.title as string)?.trim() || file.originalname || 'Document',
    fileUrl,
    importerId: req.user!._id,
    neighborhoodId,
    hash,
    status: 'draft',
  });

  return success(res, doc, 201);
}

// ─── Placer les zones de signature ───────────────────────────────────────────────

export async function setZones(req: Request, res: Response) {
  const doc = await DocumentModel.findById(req.params.id);
  if (!doc) return error(res, 'Document introuvable', 404);
  if (doc.importerId.toString() !== req.user!._id.toString()) {
    return error(res, "Seul l'importateur peut définir les zones", 403);
  }
  if (doc.status !== 'draft') {
    return error(res, 'Les zones ne sont modifiables que sur un brouillon', 400);
  }

  const zones = (req.body.zones as unknown[]) ?? [];
  if (!Array.isArray(zones)) return error(res, 'zones doit être un tableau', 400);

  doc.signatureZones = zones.map((z) => {
    const zone = z as Record<string, unknown>;
    return {
      signerId: zone.signerId as never,
      page: Number(zone.page ?? 0),
      x: Number(zone.x ?? 0),
      y: Number(zone.y ?? 0),
      width: Number(zone.width ?? 0.2),
      height: Number(zone.height ?? 0.06),
      type: (zone.type === 'initials' ? 'initials' : 'signature') as never,
    };
  });
  await doc.save();
  return success(res, doc);
}

// ─── Envoyer pour signature ──────────────────────────────────────────────────────

export async function sendForSignature(req: Request, res: Response) {
  const doc = await DocumentModel.findById(req.params.id);
  if (!doc) return error(res, 'Document introuvable', 404);
  if (doc.importerId.toString() !== req.user!._id.toString()) {
    return error(res, "Seul l'importateur peut envoyer le document", 403);
  }

  const signatories = (req.body.signatories as { userId: string; order?: number }[]) ?? [];
  if (!Array.isArray(signatories) || signatories.length === 0) {
    return error(res, 'Au moins un signataire est requis', 400);
  }

  doc.signatories = signatories.map((s, i) => ({
    userId: s.userId as never,
    order: s.order ?? i + 1,
    signedAt: undefined,
    signature: undefined,
    signatureHash: undefined,
  }));
  doc.status = 'pending_signatures';
  await doc.save();

  // Notification email best-effort aux signataires.
  try {
    const ids = doc.signatories.map((s) => s.userId);
    const users = await User.find({ _id: { $in: ids } }).select('email firstName').lean();
    await Promise.all(
      users.map((u) =>
        sendMail({
          to: u.email,
          subject: `✍️ Document à signer : ${doc.title}`,
          html: `<p>Bonjour ${u.firstName},</p><p>Un document « ${doc.title} » attend votre signature sur BobConnect.</p><p><a href="${appUrl('/documents')}">Ouvrir mes documents</a></p>`,
        }),
      ),
    );
  } catch {
    /* non bloquant */
  }

  return success(res, doc);
}

// ─── Signer (MFA requis) ──────────────────────────────────────────────────────────

export async function signDocument(req: Request, res: Response) {
  const userId = req.user!._id.toString();
  const doc = await DocumentModel.findById(req.params.id);
  if (!doc) return error(res, 'Document introuvable', 404);
  if (doc.status !== 'pending_signatures') {
    return error(res, "Ce document n'est pas en attente de signatures", 400);
  }

  const me = doc.signatories.find((s) => s.userId.toString() === userId);
  if (!me) return error(res, "Vous n'êtes pas signataire de ce document", 403);
  if (me.signedAt) return error(res, 'Vous avez déjà signé ce document', 400);

  // Ordre de signature : le prochain non-signé avec l'ordre le plus bas.
  const next = [...doc.signatories].filter((s) => !s.signedAt).sort((a, b) => a.order - b.order)[0];
  if (next.userId.toString() !== userId) {
    return error(res, "Ce n'est pas encore votre tour de signer", 400);
  }

  const signatureName = ((req.body.signature as string) ?? '').trim();
  if (!signatureName) return error(res, 'Une signature (nom) est requise', 400);

  const signedAt = new Date();
  me.signature = signatureName;
  me.signedAt = signedAt;
  me.signatureHash = crypto
    .createHash('sha256')
    .update(`${doc.hash}:${userId}:${signatureName}:${signedAt.toISOString()}`)
    .digest('hex');

  const allSigned = doc.signatories.every((s) => s.signedAt);
  if (allSigned) {
    // Tamponne le PDF avec toutes les signatures, puis verrouille le document.
    try {
      const signatures = new Map<string, StampSignature>();
      for (const s of doc.signatories) {
        signatures.set(s.userId.toString(), {
          name: s.signature ?? '',
          date: s.signedAt ? s.signedAt.toLocaleDateString('fr-FR') : '',
        });
      }
      const zones: ZoneToStamp[] = doc.signatureZones.map((z) => ({
        signerId: z.signerId.toString(),
        page: z.page,
        x: z.x,
        y: z.y,
        width: z.width,
        height: z.height,
      }));
      const signedName = path.basename(doc.fileUrl).replace(/\.pdf$/, '-signed.pdf');
      const signedPhysical = path.join(DOCUMENTS_UPLOAD_DIR, signedName);
      await stampSignatures(physicalPath(doc.fileUrl), signedPhysical, zones, signatures);
      doc.signedFileUrl = `${DOCUMENT_UPLOAD_PUBLIC_PREFIX}/${signedName}`;
    } catch (err) {
      console.error('[documents] stamping failed:', (err as Error).message);
    }
    doc.status = 'signed';
    doc.locked = true;
  }

  await doc.save();
  return success(res, doc);
}

// ─── Vérifier l'intégrité ─────────────────────────────────────────────────────────

export async function verifyDocument(req: Request, res: Response) {
  const userId = req.user!._id.toString();
  const doc = await DocumentModel.findById(req.params.id);
  if (!doc) return error(res, 'Document introuvable', 404);
  if (!canAccess(doc, userId)) return error(res, 'Accès refusé', 403);

  let integrity: 'ok' | 'altered' | 'missing' = 'missing';
  try {
    const currentHash = hashFile(physicalPath(doc.fileUrl));
    integrity = currentHash === doc.hash ? 'ok' : 'altered';
  } catch {
    integrity = 'missing';
  }

  return success(res, {
    integrity,
    hash: doc.hash,
    status: doc.status,
    locked: doc.locked,
    signatories: doc.signatories.map((s) => ({
      userId: s.userId,
      order: s.order,
      signedAt: s.signedAt,
      signatureHash: s.signatureHash,
    })),
  });
}
