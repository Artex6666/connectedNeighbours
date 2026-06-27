import mongoose, { Document as MongoDocument, Schema, Types } from 'mongoose';

export type DocumentStatus = 'draft' | 'pending_signatures' | 'signed' | 'archived';

export type SignatureZoneType = 'signature' | 'initials';

export interface SignatureZone {
  signerId: Types.ObjectId;
  page: number;
  /** Position/size as fractions (0..1) of the page, origin top-left. */
  x: number;
  y: number;
  width: number;
  height: number;
  type: SignatureZoneType;
}

export interface Signatory {
  userId: Types.ObjectId;
  order: number;
  signedAt?: Date;
  /** Typed full name applied as the signature. */
  signature?: string;
  /** sha256(hash + userId + signature + signedAt) — proof of this signature. */
  signatureHash?: string;
}

export interface IDocument extends MongoDocument {
  title: string;
  fileUrl: string;
  signedFileUrl?: string;
  importerId: Types.ObjectId;
  neighborhoodId: Types.ObjectId;
  signatureZones: SignatureZone[];
  signatories: Signatory[];
  status: DocumentStatus;
  /** sha256 of the original uploaded PDF — used for integrity verification. */
  hash?: string;
  /** Set true once every signatory has signed; the document is then locked. */
  locked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    signedFileUrl: { type: String },
    importerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    neighborhoodId: { type: Schema.Types.ObjectId, ref: 'Neighborhood', required: true },
    signatureZones: [
      {
        signerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        page: { type: Number, default: 0 },
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, default: 0.2 },
        height: { type: Number, default: 0.06 },
        type: { type: String, enum: ['signature', 'initials'], default: 'signature' },
      },
    ],
    signatories: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        order: { type: Number, required: true },
        signedAt: { type: Date },
        signature: { type: String },
        signatureHash: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'pending_signatures', 'signed', 'archived'],
      default: 'draft',
    },
    hash: { type: String },
    locked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model<IDocument>('Document', DocumentSchema);
