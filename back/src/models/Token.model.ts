import { Schema, model, Types } from 'mongoose';

export interface IToken {
  token: string;
  userId: Types.ObjectId;
  createdAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Auto-delete refresh tokens after 7 days
tokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export default model<IToken>('Token', tokenSchema);
