import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { createRemoteJWKSet, jwtVerify } from 'jose';

function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';
  if (origin.endsWith('.vercel.app') || origin.startsWith('http://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Kiosk-Key');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

async function verifyAdmin(req: VercelRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return false;
  try {
    const JWKS = createRemoteJWKSet(new URL(process.env.JWKS_URL!));
    const { payload } = await jwtVerify(authHeader.slice(7), JWKS, { algorithms: ['RS256'] });
    return !!(payload.sub && payload.email);
  } catch { return false; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const sql = neon(process.env.DATABASE_URL!);

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM announcements WHERE active = true ORDER BY importance ASC, created_at DESC`;
      return res.json(rows);
    }

    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'POST') {
      const { title, description, type, importance, date } = req.body;
      if (!title || !description || !type || !importance || !date) {
        return res.status(400).json({ error: 'All fields required' });
      }
      const rows = await sql`INSERT INTO announcements (title, description, type, importance, date) VALUES (${title}, ${description}, ${type}, ${importance}, ${date}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, title, description, type, importance, date, active } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const rows = await sql`UPDATE announcements SET title = COALESCE(${title}, title), description = COALESCE(${description}, description), type = COALESCE(${type}, type), importance = COALESCE(${importance}, importance), date = COALESCE(${date}, date), active = COALESCE(${active}, active), updated_at = NOW() WHERE id = ${id} RETURNING *`;
      return res.json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      await sql`DELETE FROM announcements WHERE id = ${id}`;
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
