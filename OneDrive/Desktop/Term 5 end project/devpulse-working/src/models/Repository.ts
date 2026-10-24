// src/models/Repository.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IRepository extends Document {
  name: string;
  url: string;
  owner: Types.ObjectId;
  githubRepoId?: string;
  createdAt: Date;
}

const RepositorySchema = new Schema<IRepository>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    githubRepoId: { type: String },
  },
  { timestamps: true }
);

const Repository: Model<IRepository> =
  mongoose.models.Repository ?? mongoose.model<IRepository>('Repository', RepositorySchema);

export default Repository;
