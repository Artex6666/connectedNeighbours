import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

export interface IMessageReport extends Document {
  messageId: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reason: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MessageReportSchema = new Schema<IMessageReport>(
  {
    messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

export default mongoose.model<IMessageReport>('MessageReport', MessageReportSchema);
