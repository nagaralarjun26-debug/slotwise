// src/models/CodeAnalysis.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICodeAnalysis extends Document {
  pullRequest: Types.ObjectId;
  analysis: Record<string, unknown>;
  score?: number;
  createdAt: Date;
}

const CodeAnalysisSchema = new Schema<ICodeAnalysis>(
  {
    pullRequest: { type: Schema.Types.ObjectId, ref: 'PullRequest', required: true },
    analysis: { type: Schema.Types.Mixed, required: true },
    score: { type: Number, min: 0, max: 100 },
  },
  { timestamps: true }
);

const CodeAnalysis: Model<ICodeAnalysis> =
  mongoose.models.CodeAnalysis ?? mongoose.model<ICodeAnalysis>('CodeAnalysis', CodeAnalysisSchema);

export default CodeAnalysis;
