import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description: string;
  neighborhoodId: Types.ObjectId;
  createdBy: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    neighborhoodId: { type: Schema.Types.ObjectId, ref: 'Neighborhood', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
  },
  { timestamps: true },
);

export default mongoose.model<IGroup>('Group', GroupSchema);
