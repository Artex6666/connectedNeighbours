import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INeighborhood extends Document {
  name: string;
  description: string;
  polygon: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  adminId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NeighborhoodSchema = new Schema<INeighborhood>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    polygon: {
      type: {
        type: String,
        enum: ['Polygon'],
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

NeighborhoodSchema.index({ polygon: '2dsphere' });

export default mongoose.model<INeighborhood>('Neighborhood', NeighborhoodSchema);
