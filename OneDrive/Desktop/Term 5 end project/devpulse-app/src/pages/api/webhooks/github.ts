// src/pages/api/webhooks/github.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { codeAuditQueue } from '../../../src/lib/queue';

/**
 * Verify GitHub webhook signature using the secret stored in GITHUB_CLIENT_SECRET.
 */
function verifySignature(req: NextApiRequest, rawBody: Buffer): boolean {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  if (!signature) return false;
  const secret = process.env.GITHUB_CLIENT_SECRET;
  if (!secret) return false;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const digest = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export const config = {
  api: {
    bodyParser: false, // we need raw body for signature verification
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const rawBody = Buffer.concat(chunks);

  if (!verifySignature(req, rawBody)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const payload = JSON.parse(rawBody.toString());
  // We only care about pull request opened events
  if (payload.action !== 'opened' || !payload.pull_request) {
    return res.status(200).json({ message: 'Event ignored' });
  }

  const diff = payload.pull_request.diff_url ? await fetch(payload.pull_request.diff_url).then(r => r.text()) : '';
  await codeAuditQueue.add('audit', { diff, pullRequestId: payload.pull_request.id });

  return res.status(200).json({ message: 'Job queued' });
}
