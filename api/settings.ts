import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { jwtVerify } from 'jose';

function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';
  if (origin.endsWith('.vercel.app') || origin.startsWith('http://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
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
  const action = req.query.action as string | undefined;

  try {
    // ── Device management ──
    if (action === 'devices') {
      if (req.method === 'GET') {
        const rows = await sql`SELECT * FROM kiosk_devices ORDER BY created_at DESC`;
        return res.json(rows);
      }
      if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });

      if (req.method === 'POST') {
        const { device_id, name, floor, location } = req.body || {};
        if (!device_id) return res.status(400).json({ error: 'device_id required' });
        const rows = await sql`INSERT INTO kiosk_devices (device_id, name, floor, location)
          VALUES (${device_id}, ${name || 'Kiosk'}, ${floor || ''}, ${location || ''})
          ON CONFLICT (device_id) DO UPDATE SET name = COALESCE(NULLIF(${name || ''}, ''), kiosk_devices.name), last_seen = NOW()
          RETURNING *`;
        return res.json(rows[0]);
      }

      if (req.method === 'PUT') {
        const { id, name, floor, location, active, hidden_sections } = req.body || {};
        if (!id) return res.status(400).json({ error: 'id required' });
        const rows = await sql`UPDATE kiosk_devices SET
          name = COALESCE(${name}, name),
          floor = COALESCE(${floor}, floor),
          location = COALESCE(${location}, location),
          active = COALESCE(${active}, active),
          hidden_sections = COALESCE(${hidden_sections}, hidden_sections)
          WHERE id = ${id} RETURNING *`;
        return res.json(rows[0] || null);
      }

      if (req.method === 'DELETE') {
        const id = req.query.id as string;
        if (!id) return res.status(400).json({ error: 'id required' });
        await sql`DELETE FROM kiosk_devices WHERE id = ${Number(id)}`;
        return res.json({ success: true });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (action === 'sync-signal') {
      if (req.method === 'GET') {
        const rows = await sql`SELECT value FROM kiosk_settings WHERE key = 'sync_requested_at' LIMIT 1`;
        return res.json({ sync_requested_at: rows[0]?.value ?? null });
      }
      if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });
      if (req.method === 'POST') {
        const syncRequestedAt = new Date().toISOString();
        await sql`INSERT INTO kiosk_settings (key, value, updated_at) VALUES ('sync_requested_at', ${JSON.stringify(syncRequestedAt)}, NOW())
          ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(syncRequestedAt)}, updated_at = NOW()`;
        return res.json({ sync_requested_at: syncRequestedAt });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Global settings ──
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
