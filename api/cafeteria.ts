import type { VercelRequest, VercelResponse } from '@vercel/node';
import sql from './_lib/db';
import { cors } from './_lib/cors';
import { verifyAdmin, unauthorized } from './_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method === 'GET') {
    const categories = await sql`SELECT * FROM cafeteria_categories WHERE active = true ORDER BY sort_order ASC`;
    const items = await sql`SELECT * FROM cafeteria_items WHERE active = true ORDER BY sort_order ASC`;

    const menu = categories.map((cat: any) => ({
      ...cat,
      items: items.filter((item: any) => item.category_id === cat.id),
    }));
    return res.json(menu);
  }

  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized(res);

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
}
