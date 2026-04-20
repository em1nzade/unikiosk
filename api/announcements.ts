import type { VercelRequest, VercelResponse } from '@vercel/node';
import sql from './_lib/db';
import { cors } from './_lib/cors';
import { verifyAdmin, unauthorized } from './_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM announcements WHERE active = true ORDER BY importance ASC, created_at DESC`;
    return res.json(rows);
  }

  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized(res);

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
}
