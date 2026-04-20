import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const origin = req.headers.origin || '';
  if (origin.endsWith('.vercel.app') || origin.startsWith('http://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Kiosk-Key');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = neon(process.env.DATABASE_URL!);

    const result = await sql`
      SELECT 
        (SELECT MAX(updated_at) FROM announcements) as ann_updated,
        (SELECT MAX(updated_at) FROM exams) as exam_updated,
        (SELECT MAX(updated_at) FROM events) as event_updated,
        (SELECT MAX(updated_at) FROM info_content) as info_updated
    `;

    const timestamps = result[0];
    const etag = Buffer.from(JSON.stringify(timestamps)).toString('base64');
    
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === etag) {
      return res.status(304).end();
    }

    const [announcements, exams, events, cafeteria_categories, cafeteria_items, info, settingsRows] = await Promise.all([
      sql`SELECT * FROM announcements WHERE active = true ORDER BY importance ASC, created_at DESC`,
      sql`SELECT * FROM exams WHERE active = true ORDER BY exam_date ASC, time_slot ASC`,
      sql`SELECT * FROM events WHERE active = true ORDER BY created_at DESC`,
      sql`SELECT * FROM cafeteria_categories WHERE active = true ORDER BY sort_order ASC`,
      sql`SELECT * FROM cafeteria_items WHERE active = true ORDER BY sort_order ASC`,
      sql`SELECT * FROM info_content WHERE active = true ORDER BY sort_order ASC`,
      sql`SELECT key, value FROM kiosk_settings`,
    ]);

    const cafeteria = cafeteria_categories.map((cat: any) => ({
      ...cat,
      items: cafeteria_items.filter((item: any) => item.category_id === cat.id),
    }));

    const settings: Record<string, any> = {};
    for (const row of settingsRows) {
      settings[row.key] = row.value;
    }

    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'no-cache');
    return res.json({ announcements, exams, events, cafeteria, info, settings, etag });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
