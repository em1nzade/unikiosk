import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { jwtVerify } from 'jose';

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
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
    const { payload } = await jwtVerify(authHeader.slice(7), secret, { algorithms: ['HS256'] });
    return !!(payload.sub && payload.email);
  } catch { return false; }
}

async function requestKioskSync(sql: ReturnType<typeof neon>) {
  const syncRequestedAt = new Date().toISOString();
  await sql`INSERT INTO kiosk_settings (key, value, updated_at) VALUES ('sync_requested_at', ${JSON.stringify(syncRequestedAt)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(syncRequestedAt)}, updated_at = NOW()`;
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

    if (req.method === 'GET') {
      if (req.query.id) {
        const eventId = Number(req.query.id);
        if (!Number.isInteger(eventId) || eventId <= 0) return res.status(400).json({ error: 'Invalid event id' });
        const rows = await sql`SELECT * FROM events WHERE id = ${eventId} AND active = true LIMIT 1`;
        if (!rows[0]) return res.status(404).json({ error: 'Tədbir tapılmadı' });
        return res.json(rows[0]);
      }

      if (req.query.include === 'all') {
        if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });
        const rows = await sql`SELECT e.*, COUNT(r.id)::int AS registration_count
          FROM events e
          LEFT JOIN event_registrations r ON r.event_id = e.id
          GROUP BY e.id
          ORDER BY e.active DESC, e.created_at DESC`;
        return res.json(rows);
      }
      const rows = await sql`SELECT * FROM events WHERE active = true ORDER BY created_at DESC`;
      return res.json(rows);
    }

    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'POST') {
      const { title, description, date, time_slot, location, type, image_url, registration_enabled } = req.body;
      if (!title || !description || !date || !time_slot || !location || !type) {
        return res.status(400).json({ error: 'All fields required' });
      }
      const rows = await sql`INSERT INTO events (title, description, date, time_slot, location, type, image_url, registration_enabled, active)
        VALUES (${title}, ${description}, ${date}, ${time_slot}, ${location}, ${type}, ${image_url || null}, ${registration_enabled !== false}, true)
        RETURNING *`;
      await requestKioskSync(sql);
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, ...fields } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const hasImage = fields.image_url !== undefined;
      const rows = await sql`UPDATE events SET
        title = COALESCE(${fields.title ?? null}, title),
        description = COALESCE(${fields.description ?? null}, description),
        date = COALESCE(${fields.date ?? null}, date),
        time_slot = COALESCE(${fields.time_slot ?? null}, time_slot),
        location = COALESCE(${fields.location ?? null}, location),
        type = COALESCE(${fields.type ?? null}, type),
        image_url = CASE WHEN ${hasImage} THEN ${fields.image_url || null} ELSE image_url END,
        registration_enabled = COALESCE(${fields.registration_enabled ?? null}, registration_enabled),
        active = COALESCE(${fields.active ?? null}, active),
        updated_at = NOW()
        WHERE id = ${id} RETURNING *`;
      await requestKioskSync(sql);
      return res.json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      await sql`DELETE FROM events WHERE id = ${id}`;
      await requestKioskSync(sql);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
