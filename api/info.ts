import type { VercelRequest, VercelResponse } from '@vercel/node';
import sql from './_lib/db';
import { cors } from './_lib/cors';
import { verifyAdmin, unauthorized } from './_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM info_content WHERE active = true ORDER BY sort_order ASC`;
    return res.json(rows);
  }

  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized(res);

  if (req.method === 'PUT') {
    const { id, title, content } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });
    const rows = await sql`UPDATE info_content SET title = COALESCE(${title ?? null}, title), content = COALESCE(${content ?? null}, content), updated_at = NOW() WHERE id = ${id} RETURNING *`;
    return res.json(rows[0]);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
