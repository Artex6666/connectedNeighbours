import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  location: string;
  maxParticipants: number;
  organizerId: Types.ObjectId;
  neighborhoodId: Types.ObjectId;
  coverPhoto?: string;
  participants: Types.ObjectId[];
  waitingList: Types.ObjectId[];
  isCancelled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    maxParticipants: { type: Number, required: true, min: 1 },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    neighborhoodId: { type: Schema.Types.ObjectId, ref: 'Neighborhood', required: true },
    coverPhoto: { type: String },
    participants: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    waitingList: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    isCancelled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model<IEvent>('Event', EventSchema);
