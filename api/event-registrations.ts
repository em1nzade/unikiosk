import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { jwtVerify } from 'jose';
import { cleanRegistrationText, validateRegistrationInput } from './event-registration-utils.js';

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

async function ensureEventRegistrationSchema(sql: ReturnType<typeof neon>) {
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_enabled BOOLEAN NOT NULL DEFAULT true`;
  await sql`CREATE TABLE IF NOT EXISTS event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const sql = neon(process.env.DATABASE_URL!);

  try {
    await ensureEventRegistrationSchema(sql);

    if (req.method === 'POST') {
      const { eventId, fullName, groupName } = validateRegistrationInput(req.body);
      const events = await sql`SELECT id, title, active, registration_enabled FROM events WHERE id = ${eventId} LIMIT 1`;
      const event = events[0];
      if (!event || event.active === false) return res.status(404).json({ error: 'Tədbir tapılmadı' });
      if (event.registration_enabled === false) return res.status(403).json({ error: 'Bu tədbir üçün qeydiyyat bağlıdır' });

      const userAgent = cleanRegistrationText(req.headers['user-agent'], 300);
      const rows = await sql`INSERT INTO event_registrations (event_id, full_name, group_name, user_agent)
        VALUES (${eventId}, ${fullName}, ${groupName}, ${userAgent})
        RETURNING id, event_id, full_name, group_name, user_agent, created_at`;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'GET') {
      if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });
      const eventId = req.query.event_id ? Number(req.query.event_id) : null;
      if (eventId !== null && (!Number.isInteger(eventId) || eventId <= 0)) {
        return res.status(400).json({ error: 'Invalid event id' });
      }

      const rows = eventId
        ? await sql`SELECT r.id, r.event_id, e.title AS event_title, r.full_name, r.group_name, r.user_agent, r.created_at
          FROM event_registrations r
          JOIN events e ON e.id = r.event_id
          WHERE r.event_id = ${eventId}
          ORDER BY r.created_at DESC
          LIMIT 500`
        : await sql`SELECT r.id, r.event_id, e.title AS event_title, r.full_name, r.group_name, r.user_agent, r.created_at
          FROM event_registrations r
          JOIN events e ON e.id = r.event_id
          ORDER BY r.created_at DESC
          LIMIT 500`;
      return res.json(rows);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
