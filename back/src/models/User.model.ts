import mongoose, { Document, Schema, Types } from 'mongoose';

export type UserRole = 'resident' | 'moderator' | 'admin';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  role: UserRole;
  neighborhoodId?: Types.ObjectId;
  mfaSecret?: string;
  isMfaEnabled: boolean;
  points: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    role: { type: String, enum: ['resident', 'moderator', 'admin'], default: 'resident' },
    neighborhoodId: { type: Schema.Types.ObjectId, ref: 'Neighborhood' },
    mfaSecret: { type: String, select: false },
    isMfaEnabled: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>('User', UserSchema);
