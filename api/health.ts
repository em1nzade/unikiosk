import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    hasDbUrl: !!process.env.DATABASE_URL,
    hasJwks: !!process.env.JWKS_URL,
    dbUrlLength: (process.env.DATABASE_URL || '').length,
  });
}
