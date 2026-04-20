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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const sql = neon(process.env.DATABASE_URL!);

  try {
    if (req.method === 'GET') {
      const { group } = req.query;
      if (group) {
        const g = String(group);
        const rows = await sql`SELECT * FROM exams WHERE active = true AND group_number = ${g} ORDER BY exam_date ASC`;
        return res.json(rows);
      }
      const rows = await sql`SELECT * FROM exams WHERE active = true ORDER BY exam_date ASC, time_slot ASC`;
      return res.json(rows);
    }

    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'POST') {
      const { subject, faculty, group_number, room, time_slot, exam_date, exam_month } = req.body;
      if (!subject || !faculty || !group_number || !room || !time_slot || !exam_date || !exam_month) {
        return res.status(400).json({ error: 'All fields required' });
      }
      const rows = await sql`INSERT INTO exams (subject, faculty, group_number, room, time_slot, exam_date, exam_month) VALUES (${subject}, ${faculty}, ${group_number}, ${room}, ${time_slot}, ${exam_date}, ${exam_month}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, ...fields } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const rows = await sql`UPDATE exams SET subject = COALESCE(${fields.subject ?? null}, subject), faculty = COALESCE(${fields.faculty ?? null}, faculty), group_number = COALESCE(${fields.group_number ?? null}, group_number), room = COALESCE(${fields.room ?? null}, room), time_slot = COALESCE(${fields.time_slot ?? null}, time_slot), exam_date = COALESCE(${fields.exam_date ?? null}, exam_date), exam_month = COALESCE(${fields.exam_month ?? null}, exam_month), active = COALESCE(${fields.active ?? null}, active), updated_at = NOW() WHERE id = ${id} RETURNING *`;
      return res.json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      await sql`DELETE FROM exams WHERE id = ${id}`;
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
