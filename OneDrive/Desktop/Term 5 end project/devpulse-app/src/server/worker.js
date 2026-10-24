// src/server/worker.js
require('dotenv').config({ path: '../../.env.local' });

const { Queue, Worker, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL);

new QueueScheduler('codeAudit', { connection });
const queue = new Queue('codeAudit', { connection });

const worker = new Worker('codeAudit', async job => {
  const { diff, pullRequestId } = job.data;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: diff }] }]
    })
  });
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }
  const data = await response.json();
  let analysisJson;
  try {
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    analysisJson = JSON.parse(text);
  } catch (e) {
    analysisJson = { raw: data };
  }
  await prisma.codeAnalysis.create({
    data: {
      pullRequestId: pullRequestId,
      analysis: analysisJson,
      score: analysisJson.score || null,
    },
  });
  return { success: true };
}, { connection });

worker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed`, result);
});
worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log('BullMQ worker started, listening on queue "codeAudit"');
