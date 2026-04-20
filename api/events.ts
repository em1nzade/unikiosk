import type { VercelRequest, VercelResponse } from '@vercel/node';
import sql from './_lib/db';
import { cors } from './_lib/cors';
import { verifyAdmin, unauthorized } from './_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM events WHERE active = true ORDER BY created_at DESC`;
    return res.json(rows);
  }

  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized(res);

  if (req.method === 'POST') {
    const { title, description, date, time_slot, location, type, image_url } = req.body;
    if (!title || !description || !date || !time_slot || !location || !type) {
      return res.status(400).json({ error: 'All fields required' });
    }
    const rows = await sql`INSERT INTO events (title, description, date, time_slot, location, type, image_url) VALUES (${title}, ${description}, ${date}, ${time_slot}, ${location}, ${type}, ${image_url || null}) RETURNING *`;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const { id, ...fields } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });
    const rows = await sql`UPDATE events SET title = COALESCE(${fields.title ?? null}, title), description = COALESCE(${fields.description ?? null}, description), date = COALESCE(${fields.date ?? null}, date), time_slot = COALESCE(${fields.time_slot ?? null}, time_slot), location = COALESCE(${fields.location ?? null}, location), type = COALESCE(${fields.type ?? null}, type), image_url = COALESCE(${fields.image_url ?? null}, image_url), active = COALESCE(${fields.active ?? null}, active), updated_at = NOW() WHERE id = ${id} RETURNING *`;
    return res.json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });
    await sql`DELETE FROM events WHERE id = ${id}`;
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
