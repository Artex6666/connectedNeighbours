import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVoteComment extends Document {
  voteId: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const VoteCommentSchema = new Schema<IVoteComment>(
  {
    voteId: { type: Schema.Types.ObjectId, ref: 'Vote', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

export default mongoose.model<IVoteComment>('VoteComment', VoteCommentSchema);
