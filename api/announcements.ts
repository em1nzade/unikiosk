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

async function verifyAdmin(req: VercelRequest): Promise<{ ok: false } | { ok: true; role: string; faculty_ids: number[] }> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return { ok: false };
  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
    const { payload } = await jwtVerify(authHeader.slice(7), secret, { algorithms: ['HS256'] });
    if (!payload.sub || !payload.email) return { ok: false };
    return {
      ok: true,
      role: (payload.role as string) || 'admin',
      faculty_ids: (payload.faculty_ids as number[]) || [],
    };
  } catch { return { ok: false }; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const sql = neon(process.env.DATABASE_URL!);

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM announcements WHERE active = true ORDER BY importance ASC, created_at DESC`;
      return res.json(rows);
    }

    const admin = await verifyAdmin(req);
    if (!admin.ok) return res.status(401).json({ error: 'Unauthorized' });
    const isSuperAdmin = admin.role === 'superadmin';
    const allowedFacultyIds = admin.faculty_ids; // empty = unrestricted for non-super if role is admin

    if (req.method === 'POST') {
      const { title, description, type, importance, date, faculty_id } = req.body;
      if (!title || !description || !type || !importance || !date) {
        return res.status(400).json({ error: 'All fields required' });
      }
      // Faculty-scoped admins can only post for their own faculties
      const fid = faculty_id ? Number(faculty_id) : null;
      if (!isSuperAdmin && allowedFacultyIds.length > 0 && fid && !allowedFacultyIds.includes(fid)) {
        return res.status(403).json({ error: 'Bu fakültə üçün icazəniz yoxdur' });
      }
      const rows = await sql`INSERT INTO announcements (title, description, type, importance, date, faculty_id) VALUES (${title}, ${description}, ${type}, ${importance}, ${date}, ${fid}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, title, description, type, importance, date, active, faculty_id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      // Check ownership for faculty-scoped admins
      if (!isSuperAdmin && allowedFacultyIds.length > 0) {
        const existing = await sql`SELECT faculty_id FROM announcements WHERE id = ${id}`;
        if (existing[0] && existing[0].faculty_id && !allowedFacultyIds.includes(existing[0].faculty_id)) {
          return res.status(403).json({ error: 'Bu elanı dəyişməyə icazəniz yoxdur' });
        }
      }
      const fid = faculty_id !== undefined ? (faculty_id ? Number(faculty_id) : null) : undefined;
      const rows = await sql`UPDATE announcements SET title = COALESCE(${title}, title), description = COALESCE(${description}, description), type = COALESCE(${type}, type), importance = COALESCE(${importance}, importance), date = COALESCE(${date}, date), active = COALESCE(${active}, active), faculty_id = COALESCE(${fid !== undefined ? fid : null}, faculty_id), updated_at = NOW() WHERE id = ${id} RETURNING *`;
      return res.json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      if (!isSuperAdmin && allowedFacultyIds.length > 0) {
        const existing = await sql`SELECT faculty_id FROM announcements WHERE id = ${id}`;
        if (existing[0] && existing[0].faculty_id && !allowedFacultyIds.includes(existing[0].faculty_id)) {
          return res.status(403).json({ error: 'Bu elanı silməyə icazəniz yoxdur' });
        }
      }
      await sql`DELETE FROM announcements WHERE id = ${id}`;
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
