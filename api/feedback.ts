import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { jwtVerify } from 'jose';

function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';
  if (origin.endsWith('.vercel.app') || origin.startsWith('http://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
  } catch {
    return false;
  }
}

async function ensureFeedbackTable(sql: ReturnType<typeof neon>) {
  await sql`CREATE TABLE IF NOT EXISTS feedback_messages (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL DEFAULT 'teklif' CHECK (category IN ('teklif', 'irad')),
    message TEXT NOT NULL,
    name TEXT,
    contact TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read')),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
}

function cleanOptional(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const sql = neon(process.env.DATABASE_URL!);

  try {
    await ensureFeedbackTable(sql);

    if (req.method === 'POST') {
      const message = cleanOptional(req.body?.message, 2000);
      if (!message || message.length < 3) {
        return res.status(400).json({ error: 'Mesaj ən azı 3 simvol olmalıdır' });
      }

      const category = req.body?.category === 'irad' ? 'irad' : 'teklif';
      const name = cleanOptional(req.body?.name, 100);
      const contact = cleanOptional(req.body?.contact, 120);
      const userAgent = cleanOptional(req.headers['user-agent'], 300);

      const rows = await sql`INSERT INTO feedback_messages (category, message, name, contact, user_agent)
        VALUES (${category}, ${message}, ${name}, ${contact}, ${userAgent})
        RETURNING id, category, message, name, contact, status, user_agent, created_at`;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'GET') {
      if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });
      const rows = await sql`SELECT id, category, message, name, contact, status, user_agent, created_at
        FROM feedback_messages
        ORDER BY created_at DESC
        LIMIT 200`;
      return res.json(rows);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
