import mongoose, { Document, Schema, Types } from 'mongoose';

export type VoteType = 'yesno' | 'single' | 'multiple' | 'weighted';

export interface VoteOption {
  label: string;
  votes: number;
}

export interface IVote extends Document {
  question: string;
  type: VoteType;
  options: VoteOption[];
  authorId: Types.ObjectId;
  neighborhoodId: Types.ObjectId;
  isAnonymous: boolean;
  openAt: Date;
  closeAt: Date;
  quorum?: number;
  showResultsLive: boolean;
  voters: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    question: { type: String, required: true },
    type: { type: String, enum: ['yesno', 'single', 'multiple', 'weighted'], required: true },
    options: [
      {
        label: { type: String, required: true },
        votes: { type: Number, default: 0 },
      },
    ],
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    neighborhoodId: { type: Schema.Types.ObjectId, ref: 'Neighborhood', required: true },
    isAnonymous: { type: Boolean, default: false },
    openAt: { type: Date, required: true },
    closeAt: { type: Date, required: true },
    quorum: { type: Number },
    showResultsLive: { type: Boolean, default: false },
    voters: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
  },
  { timestamps: true },
);

export default mongoose.model<IVote>('Vote', VoteSchema);
