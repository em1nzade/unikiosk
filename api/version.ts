import type { VercelRequest, VercelResponse } from '@vercel/node';

// Returns the deployment timestamp. Each Vercel deploy produces a new value,
// so the Electron shell can compare and auto-reload when it changes.
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || 'dev',
    deployedAt: process.env.VERCEL_ENV ? new Date().toISOString() : null,
    buildId: process.env.VERCEL_DEPLOYMENT_ID || 'local',
  });
}
