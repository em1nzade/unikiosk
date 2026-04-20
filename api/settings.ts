import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { jwtVerify } from 'jose';

function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';
  if (origin.endsWith('.vercel.app') || origin.startsWith('http://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

async function verifyAdmin(req: VercelRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return false;
  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
    const { payload } = await jwtVerify(authHeader.slice(7), secret, { algorithms: ['HS256'] });
    return !!(payload.sub && payload.email);
  } catch { return false; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const sql = neon(process.env.DATABASE_URL!);

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT key, value FROM kiosk_settings`;
      const settings: Record<string, any> = {};
      for (const row of rows) {
        settings[row.key] = row.value;
      }
      return res.json(settings);
    }

    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'PUT') {
      const updates = req.body;
      if (!updates || typeof updates !== 'object') return res.status(400).json({ error: 'Body must be an object' });

      for (const [key, value] of Object.entries(updates)) {
        await sql`INSERT INTO kiosk_settings (key, value, updated_at) VALUES (${key}, ${JSON.stringify(value)}, NOW())
          ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()`;
      }
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
