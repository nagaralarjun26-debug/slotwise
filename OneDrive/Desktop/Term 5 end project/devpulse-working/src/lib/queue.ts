// src/lib/queue.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env.local' });

const connection = new IORedis(process.env.REDIS_URL);

export const codeAuditQueue = new Queue('codeAudit', { connection });
export default codeAuditQueue;
