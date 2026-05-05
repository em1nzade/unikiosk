import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { jwtVerify } from 'jose';
import { hash } from 'bcryptjs';

function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';
  if (origin.endsWith('.vercel.app') || origin.startsWith('http://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

async function verifyAdmin(req: VercelRequest): Promise<{ sub: string; role: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
    const { payload } = await jwtVerify(authHeader.slice(7), secret, { algorithms: ['HS256'] });
    return { sub: payload.sub as string, role: (payload.role as string) || 'admin' };
  } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const admin = await verifyAdmin(req);
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });

  const sql = neon(process.env.DATABASE_URL!);

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT id, email, name, role, active, permissions, created_at FROM admin_users ORDER BY created_at ASC`;
      return res.json(rows);
    }

    // Only superadmin can manage users
    if (admin.role !== 'superadmin') return res.status(403).json({ error: 'Yalnız superadmin istifadəçiləri idarə edə bilər' });

    if (req.method === 'POST') {
      const { email, password, name, role, permissions } = req.body;
      if (!email || !password || !name) return res.status(400).json({ error: 'Email, şifrə və ad tələb olunur' });
      const passwordHash = await hash(password, 10);
      const perms = permissions || (role === 'superadmin'
        ? ['dashboard', 'announcements', 'faculties', 'schedules', 'events', 'cafeteria', 'info', 'feedback', 'settings', 'users', 'devices']
        : ['dashboard', 'announcements', 'faculties', 'schedules', 'events', 'cafeteria', 'info', 'feedback']);
      const rows = await sql`INSERT INTO admin_users (email, password_hash, name, role, permissions) VALUES (${email}, ${passwordHash}, ${name}, ${role || 'admin'}, ${JSON.stringify(perms)}) RETURNING id, email, name, role, active, permissions, created_at`;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, email, name, role, active, password, permissions } = req.body;
      if (!id) return res.status(400).json({ error: 'ID tələb olunur' });

      // Don't let superadmin deactivate themselves
      if (String(id) === admin.sub && active === false) {
        return res.status(400).json({ error: 'Öz hesabınızı deaktiv edə bilməzsiniz' });
      }

      if (password) {
        const passwordHash = await hash(password, 10);
        const rows = await sql`UPDATE admin_users SET email = COALESCE(${email}, email), name = COALESCE(${name}, name), role = COALESCE(${role}, role), active = COALESCE(${active}, active), password_hash = ${passwordHash}, permissions = COALESCE(${permissions ? JSON.stringify(permissions) : null}, permissions), updated_at = NOW() WHERE id = ${id} RETURNING id, email, name, role, active, permissions, created_at`;
        return res.json(rows[0]);
      }

      const rows = await sql`UPDATE admin_users SET email = COALESCE(${email || null}, email), name = COALESCE(${name || null}, name), role = COALESCE(${role || null}, role), active = COALESCE(${active}, active), permissions = COALESCE(${permissions ? JSON.stringify(permissions) : null}, permissions), updated_at = NOW() WHERE id = ${id} RETURNING id, email, name, role, active, permissions, created_at`;
      return res.json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID tələb olunur' });
      if (String(id) === admin.sub) return res.status(400).json({ error: 'Öz hesabınızı silə bilməzsiniz' });
      await sql`DELETE FROM admin_users WHERE id = ${id}`;
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      return res.status(400).json({ error: 'Bu email artıq mövcuddur' });
    }
    return res.status(500).json({ error: err.message });
  }
}
