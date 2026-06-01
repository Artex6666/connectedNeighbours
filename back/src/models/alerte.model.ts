import mongoose, { Schema, Document } from 'mongoose';

export interface IAlerte extends Document {
  title: string;
  message: string;
  level: 'info' | 'warning' | 'danger';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlerteSchema = new Schema<IAlerte>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    level: {
      type: String,
      enum: ['info', 'warning', 'danger'],
      default: 'info',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAlerte>('Alerte', AlerteSchema);