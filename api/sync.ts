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
    const deviceId = req.query.device as string | undefined;

    // Auto-register / update last_seen for kiosk devices
    let hiddenSections: string[] = [];
    if (deviceId) {
      const devices = await sql`INSERT INTO kiosk_devices (device_id) VALUES (${deviceId})
        ON CONFLICT (device_id) DO UPDATE SET last_seen = NOW()
        RETURNING hidden_sections, active`;
      if (devices[0]) {
        hiddenSections = devices[0].hidden_sections || [];
        if (devices[0].active === false) {
          return res.json({ paused: true, etag: '', announcements: [], exams: [], events: [], cafeteria: [], info: [], settings: { kiosk_paused: true } });
        }
      }
    }

    const [announcements, events, cafeteria_categories, cafeteria_items, info, settingsRows, fac_rows, dept_rows, content_rows, schedule_rows] = await Promise.all([
      sql`SELECT * FROM announcements WHERE active = true ORDER BY importance ASC, created_at DESC`,
      sql`SELECT * FROM events WHERE active = true ORDER BY created_at DESC`,
      sql`SELECT * FROM cafeteria_categories WHERE active = true ORDER BY sort_order ASC`,
      sql`SELECT * FROM cafeteria_items WHERE active = true ORDER BY sort_order ASC`,
      sql`SELECT * FROM info_content WHERE active = true ORDER BY sort_order ASC`,
      sql`SELECT key, value FROM kiosk_settings`,
      sql`SELECT * FROM faculties WHERE active = true ORDER BY sort_order ASC`,
      sql`SELECT * FROM departments WHERE active = true ORDER BY sort_order ASC`,
      sql`SELECT * FROM dept_content WHERE active = true ORDER BY sort_order ASC, created_at DESC`,
      sql`SELECT * FROM schedules ORDER BY faculty_id, course_year, sector`,
    ]);

    const cafeteria = cafeteria_categories.map((cat: any) => ({
      ...cat,
      items: cafeteria_items.filter((item: any) => item.category_id === cat.id),
    }));

    const faculties = fac_rows.map((f: any) => ({
      ...f,
      departments: dept_rows.filter((d: any) => d.faculty_id === f.id).map((d: any) => ({
        ...d,
        content: content_rows.filter((c: any) => c.department_id === d.id),
      })),
    }));

    const settings: Record<string, any> = {};
    for (const row of settingsRows) {
      settings[row.key] = row.value;
    }

    // Apply per-device hidden sections
    const result_data: Record<string, any> = {
      announcements: hiddenSections.includes('announcements') ? [] : announcements,
      faculties: hiddenSections.includes('exams') ? [] : faculties,
      schedules: hiddenSections.includes('exams') ? [] : schedule_rows,
      events: hiddenSections.includes('events') ? [] : events,
      cafeteria: hiddenSections.includes('cafeteria') ? [] : cafeteria,
      info: hiddenSections.includes('info') ? [] : info,
      settings,
    };

    // Compute ETag from actual data so ANY change is detected
    const etag = Buffer.from(JSON.stringify(result_data)).toString('base64url').slice(0, 32);
    result_data.etag = etag;

    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === etag) {
      return res.status(304).end();
    }

    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'no-cache');
    return res.json(result_data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
