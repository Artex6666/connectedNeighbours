import mongoose, { Document as MongoDocument, Schema, Types } from 'mongoose';

export type DocumentStatus = 'draft' | 'pending_signatures' | 'signed' | 'archived';

export interface Signatory {
  userId: Types.ObjectId;
  order: number;
  signedAt?: Date;
  signature?: string;
}

export interface IDocument extends MongoDocument {
  title: string;
  fileUrl: string;
  importerId: Types.ObjectId;
  neighborhoodId: Types.ObjectId;
  signatories: Signatory[];
  status: DocumentStatus;
  hash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    importerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    neighborhoodId: { type: Schema.Types.ObjectId, ref: 'Neighborhood', required: true },
    signatories: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        order: { type: Number, required: true },
        signedAt: { type: Date },
        signature: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'pending_signatures', 'signed', 'archived'],
      default: 'draft',
    },
    hash: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model<IDocument>('Document', DocumentSchema);
