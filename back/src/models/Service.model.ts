import mongoose, { Document, Schema, Types } from 'mongoose';

export type ServiceCategory =
  | 'bricolage'
  | 'jardinage'
  | 'garde_animaux'
  | 'cours_particuliers'
  | 'demenagement'
  | 'autre';

export type ServiceStatus = 'open' | 'pending' | 'in_progress' | 'done' | 'cancelled';

export interface IService extends Document {
  title: string;
  description: string;
  category: ServiceCategory;
  isPaid: boolean;
  points: number;
  authorId: Types.ObjectId;
  neighborhoodId: Types.ObjectId;
  status: ServiceStatus;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['bricolage', 'jardinage', 'garde_animaux', 'cours_particuliers', 'demenagement', 'autre'],
      required: true,
    },
    isPaid: { type: Boolean, default: false },
    points: { type: Number, default: 0, min: 0 },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    neighborhoodId: { type: Schema.Types.ObjectId, ref: 'Neighborhood', required: true },
    status: {
      type: String,
      enum: ['open', 'pending', 'in_progress', 'done', 'cancelled'],
      default: 'open',
    },
    photos: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model<IService>('Service', ServiceSchema);
