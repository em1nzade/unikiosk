import type { VercelRequest, VercelResponse } from '@vercel/node';

// SSE endpoint for real-time updates - kiosks connect here
// In Vercel serverless, SSE has limitations, so we use polling with ETag
// Kiosks poll this endpoint every 5 seconds

import sql from './_lib/db';
import { cors } from './_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Get latest update timestamps from all tables to create an ETag
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

  // Return fresh data bundle for kiosk
  const [announcements, exams, events, cafeteria_categories, cafeteria_items, info] = await Promise.all([
    sql`SELECT * FROM announcements WHERE active = true ORDER BY importance ASC, created_at DESC`,
    sql`SELECT * FROM exams WHERE active = true ORDER BY exam_date ASC, time_slot ASC`,
    sql`SELECT * FROM events WHERE active = true ORDER BY created_at DESC`,
    sql`SELECT * FROM cafeteria_categories WHERE active = true ORDER BY sort_order ASC`,
    sql`SELECT * FROM cafeteria_items WHERE active = true ORDER BY sort_order ASC`,
    sql`SELECT * FROM info_content WHERE active = true ORDER BY sort_order ASC`,
  ]);

  const cafeteria = cafeteria_categories.map((cat: any) => ({
    ...cat,
    items: cafeteria_items.filter((item: any) => item.category_id === cat.id),
  }));

  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'no-cache');
  return res.json({ announcements, exams, events, cafeteria, info, etag });
}
