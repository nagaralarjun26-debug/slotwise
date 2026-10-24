// src/server/worker.js
require('dotenv').config({ path: '../../.env.local' });

const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const mongoose = require('mongoose');

// ── MongoDB connection ──────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined in .env.local');

mongoose
  .connect(MONGODB_URI, { bufferCommands: false })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => { console.error('❌ MongoDB connection error:', err); process.exit(1); });

// ── Mongoose model (inline so worker.js stays a plain .js file) ─────────────
const CodeAnalysisSchema = new mongoose.Schema(
  {
    pullRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'PullRequest' },
    pullRequestGithubId: { type: Number },   // fallback — store raw GitHub PR id
    analysis: { type: mongoose.Schema.Types.Mixed, required: true },
    score: { type: Number, min: 0, max: 100 },
  },
  { timestamps: true }
);

const CodeAnalysis =
  mongoose.models.CodeAnalysis || mongoose.model('CodeAnalysis', CodeAnalysisSchema);

// ── BullMQ setup ────────────────────────────────────────────────────────────
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const queue = new Queue('codeAudit', { connection });

const worker = new Worker(
  'codeAudit',
  async (job) => {
    const { diff, pullRequestId } = job.data;

    // ── Call Gemini API ──────────────────────────────────────────────────────
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: diff }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    let analysisJson;
    try {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      analysisJson = JSON.parse(text);
    } catch {
      analysisJson = { raw: data };
    }

    // ── Persist to MongoDB via Mongoose ──────────────────────────────────────
    await CodeAnalysis.create({
      pullRequestGithubId: pullRequestId,
      analysis: analysisJson,
      score: typeof analysisJson.score === 'number' ? analysisJson.score : null,
    });

    return { success: true };
  },
  { connection }
);

worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed`, result);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

console.log('🚀 BullMQ worker started — listening on queue "codeAudit"');
