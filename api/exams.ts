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
  const entity = req.query.entity as string | undefined;

  try {
    // Public GET: return full tree for kiosk
    if (req.method === 'GET' && !entity) {
      const [faculties, departments, content] = await Promise.all([
        sql`SELECT * FROM faculties WHERE active = true ORDER BY sort_order ASC`,
        sql`SELECT * FROM departments WHERE active = true ORDER BY sort_order ASC`,
        sql`SELECT * FROM dept_content WHERE active = true ORDER BY sort_order ASC, created_at DESC`,
      ]);
      const tree = faculties.map((f: any) => ({
        ...f,
        departments: departments.filter((d: any) => d.faculty_id === f.id).map((d: any) => ({
          ...d,
          content: content.filter((c: any) => c.department_id === d.id),
        })),
      }));
      return res.json(tree);
    }

    // Admin CRUD below
    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });

    // --- Faculties ---
    if (entity === 'faculty') {
      if (req.method === 'POST') {
        const { name, sort_order } = req.body;
        if (!name) return res.status(400).json({ error: 'Name required' });
        const rows = await sql`INSERT INTO faculties (name, sort_order) VALUES (${name}, ${sort_order ?? 0}) RETURNING *`;
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'PUT') {
        const { id, name, sort_order, active } = req.body;
        if (!id) return res.status(400).json({ error: 'ID required' });
        const rows = await sql`UPDATE faculties SET name = COALESCE(${name ?? null}, name), sort_order = COALESCE(${sort_order ?? null}, sort_order), active = COALESCE(${active ?? null}, active) WHERE id = ${id} RETURNING *`;
        return res.json(rows[0]);
      }
      if (req.method === 'DELETE') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'ID required' });
        await sql`DELETE FROM faculties WHERE id = ${id}`;
        return res.json({ success: true });
      }
    }

    // --- Departments ---
    if (entity === 'department') {
      if (req.method === 'POST') {
        const { faculty_id, name, sort_order } = req.body;
        if (!faculty_id || !name) return res.status(400).json({ error: 'faculty_id and name required' });
        const rows = await sql`INSERT INTO departments (faculty_id, name, sort_order) VALUES (${faculty_id}, ${name}, ${sort_order ?? 0}) RETURNING *`;
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'PUT') {
        const { id, name, sort_order, active } = req.body;
        if (!id) return res.status(400).json({ error: 'ID required' });
        const rows = await sql`UPDATE departments SET name = COALESCE(${name ?? null}, name), sort_order = COALESCE(${sort_order ?? null}, sort_order), active = COALESCE(${active ?? null}, active) WHERE id = ${id} RETURNING *`;
        return res.json(rows[0]);
      }
      if (req.method === 'DELETE') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'ID required' });
        await sql`DELETE FROM departments WHERE id = ${id}`;
        return res.json({ success: true });
      }
    }

    // --- Content (schedule/announcement/exam) ---
    if (entity === 'content') {
      if (req.method === 'POST') {
        const { department_id, type, course_year, title, description, image_url, extra, sort_order } = req.body;
        if (!department_id || !type || !title) return res.status(400).json({ error: 'department_id, type, title required' });
        const rows = await sql`INSERT INTO dept_content (department_id, type, course_year, title, description, image_url, extra, sort_order)
          VALUES (${department_id}, ${type}, ${course_year ?? null}, ${title}, ${description ?? null}, ${image_url ?? null}, ${JSON.stringify(extra ?? {})}, ${sort_order ?? 0}) RETURNING *`;
        return res.status(201).json(rows[0]);
      }
      if (req.method === 'PUT') {
        const { id, title, description, image_url, course_year, extra, sort_order, active } = req.body;
        if (!id) return res.status(400).json({ error: 'ID required' });
        const rows = await sql`UPDATE dept_content SET
          title = COALESCE(${title ?? null}, title),
          description = COALESCE(${description ?? null}, description),
          image_url = COALESCE(${image_url ?? null}, image_url),
          course_year = COALESCE(${course_year ?? null}, course_year),
          extra = COALESCE(${extra ? JSON.stringify(extra) : null}, extra),
          sort_order = COALESCE(${sort_order ?? null}, sort_order),
          active = COALESCE(${active ?? null}, active),
          updated_at = NOW()
          WHERE id = ${id} RETURNING *`;
        return res.json(rows[0]);
      }
      if (req.method === 'DELETE') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'ID required' });
        await sql`DELETE FROM dept_content WHERE id = ${id}`;
        return res.json({ success: true });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
