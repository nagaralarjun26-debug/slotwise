// src/models/PullRequest.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPullRequest extends Document {
  title: string;
  githubPrId: number;
  diffUrl?: string;
  repository: Types.ObjectId;
  state: 'open' | 'closed' | 'merged';
  createdAt: Date;
}

const PullRequestSchema = new Schema<IPullRequest>(
  {
    title: { type: String, required: true },
    githubPrId: { type: Number, required: true },
    diffUrl: { type: String },
    repository: { type: Schema.Types.ObjectId, ref: 'Repository', required: true },
    state: { type: String, enum: ['open', 'closed', 'merged'], default: 'open' },
  },
  { timestamps: true }
);

const PullRequest: Model<IPullRequest> =
  mongoose.models.PullRequest ?? mongoose.model<IPullRequest>('PullRequest', PullRequestSchema);

export default PullRequest;
