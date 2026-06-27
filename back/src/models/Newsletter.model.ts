import mongoose, { Document, Schema, Types } from 'mongoose';

export type NewsletterStatus = 'draft' | 'scheduled' | 'sent';

export interface INewsletter extends Document {
  subject: string;
  /** Corps HTML (présentation, contenu riche). Injecté tel quel dans l'email. */
  contentHtml: string;
  status: NewsletterStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  sentCount: number;
  authorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSchema = new Schema<INewsletter>(
  {
    subject: { type: String, required: true, trim: true },
    contentHtml: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sent'],
      default: 'draft',
    },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    sentCount: { type: Number, default: 0 },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export default mongoose.model<INewsletter>('Newsletter', NewsletterSchema);
