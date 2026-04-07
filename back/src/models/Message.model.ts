import mongoose, { Document, Schema, Types } from 'mongoose';

export type MessageType = 'text' | 'photo' | 'audio';

export interface IMessage extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  conversationId: string;
  content: string;
  type: MessageType;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    conversationId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'photo', 'audio'], default: 'text' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model<IMessage>('Message', MessageSchema);
