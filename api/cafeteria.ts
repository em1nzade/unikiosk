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
      const categories = await sql`SELECT * FROM cafeteria_categories WHERE active = true ORDER BY sort_order ASC`;
      const items = await sql`SELECT * FROM cafeteria_items WHERE active = true ORDER BY sort_order ASC`;
      const menu = categories.map((cat: any) => ({
        ...cat,
        items: items.filter((item: any) => item.category_id === cat.id),
      }));
      return res.json(menu);
    }

    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'POST') {
      const { action } = req.body;
      if (action === 'add_category') {
        const { name, sort_order, highlight } = req.body;
        if (!name) return res.status(400).json({ error: 'Name required' });
        const rows = await sql`INSERT INTO cafeteria_categories (name, sort_order, highlight) VALUES (${name}, ${sort_order || 0}, ${highlight || false}) RETURNING *`;
        return res.status(201).json(rows[0]);
      }
      if (action === 'add_item') {
        const { category_id, name, price, sort_order } = req.body;
        if (!category_id || !name) return res.status(400).json({ error: 'category_id and name required' });
        const rows = await sql`INSERT INTO cafeteria_items (category_id, name, price, sort_order) VALUES (${category_id}, ${name}, ${price || null}, ${sort_order || 0}) RETURNING *`;
        return res.status(201).json(rows[0]);
      }
      return res.status(400).json({ error: 'Invalid action' });
    }

    if (req.method === 'PUT') {
      const { action, id, ...fields } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      if (action === 'update_category') {
        const rows = await sql`UPDATE cafeteria_categories SET name = COALESCE(${fields.name ?? null}, name), sort_order = COALESCE(${fields.sort_order ?? null}, sort_order), highlight = COALESCE(${fields.highlight ?? null}, highlight), active = COALESCE(${fields.active ?? null}, active) WHERE id = ${id} RETURNING *`;
        return res.json(rows[0]);
      }
      if (action === 'update_item') {
        const rows = await sql`UPDATE cafeteria_items SET name = COALESCE(${fields.name ?? null}, name), price = COALESCE(${fields.price ?? null}, price), sort_order = COALESCE(${fields.sort_order ?? null}, sort_order), active = COALESCE(${fields.active ?? null}, active) WHERE id = ${id} RETURNING *`;
        return res.json(rows[0]);
      }
      return res.status(400).json({ error: 'Invalid action' });
    }

    if (req.method === 'DELETE') {
      const { action, id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      if (action === 'delete_category') {
        await sql`DELETE FROM cafeteria_categories WHERE id = ${id}`;
      } else {
        await sql`DELETE FROM cafeteria_items WHERE id = ${id}`;
      }
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
