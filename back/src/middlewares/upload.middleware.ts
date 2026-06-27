import { Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');
const MESSAGES_DIR = path.join(UPLOADS_ROOT, 'messages');
const DOCUMENTS_DIR = path.join(UPLOADS_ROOT, 'documents');

if (!fs.existsSync(MESSAGES_DIR)) {
  fs.mkdirSync(MESSAGES_DIR, { recursive: true });
}
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-m4a',
  'audio/aac',
]);

function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'audio/webm':
      return '.webm';
    case 'audio/ogg':
      return '.ogg';
    case 'audio/mp4':
    case 'audio/x-m4a':
      return '.m4a';
    case 'audio/mpeg':
      return '.mp3';
    case 'audio/wav':
      return '.wav';
    case 'audio/aac':
      return '.aac';
    default:
      return '';
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MESSAGES_DIR),
  filename: (_req, file, cb) => {
    const id = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now()}-${id}${extFromMime(file.mimetype)}`);
  },
});

export const messageUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max
  fileFilter: (_req: Request, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

export const MESSAGE_UPLOAD_PUBLIC_PREFIX = '/uploads/messages';

// ─── PDF documents (signatures) ──────────────────────────────────────────────

const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DOCUMENTS_DIR),
  filename: (_req, _file, cb) => {
    const id = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${id}.pdf`);
  },
});

export const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (_req: Request, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Seuls les fichiers PDF sont autorisés'));
      return;
    }
    cb(null, true);
  },
});

export const DOCUMENT_UPLOAD_PUBLIC_PREFIX = '/uploads/documents';
export const DOCUMENTS_UPLOAD_DIR = DOCUMENTS_DIR;
