import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { createSyncEtag } from './sync-etag';

const DEFAULT_CAFETERIA_MENU = [
  {
    id: 1001,
    name: 'Əsas yeməklər',
    sort_order: 1,
    highlight: true,
    items: [
      'Şorba', 'Aş', 'Qreçka', 'Balıq', 'Makaron', 'Kartof qızartması', 'Püre',
      'Sosiska kartof', 'Badımcan qızartması', 'Badımcan çığırtması', 'Lobya',
      'Jülyen', 'Toyuq qızartması (ədəd)', 'Kotlet (ədəd)', 'Toyuq qulyaş',
      'Lanqet (ədəd)', 'Mal qulyaş', 'Döymə kotlet (ədəd)', 'Naggets',
      'Dolma (kələm)', 'Lobya kürüsü', 'Gül kələm', 'Kabaqçı', 'Dovğa',
      'Burger', 'Pizza', 'Peraşki', 'Hotdog',
    ].map((name, index) => ({
      id: 100100 + index + 1,
      category_id: 1001,
      name,
      price: [7, 10].includes(index) ? 2 : [16, 19].includes(index) ? 3 : [26, 27].includes(index) ? 0.5 : index === 24 ? 1.5 : 1,
      sort_order: index + 1,
    })),
  },
  {
    id: 1002,
    name: 'Salatlar',
    sort_order: 2,
    highlight: false,
    items: [
      { id: 100201, category_id: 1002, name: 'Paytaxt salat', price: 2, sort_order: 1 },
      { id: 100202, category_id: 1002, name: 'Mimoza', price: 2, sort_order: 2 },
      { id: 100203, category_id: 1002, name: 'Şuba salatı', price: 2, sort_order: 3 },
      { id: 100204, category_id: 1002, name: 'Pomidor-xiyar salatı', price: 1, sort_order: 4 },
    ],
  },
  {
    id: 1003,
    name: 'Atıştırmalıqlar',
    sort_order: 3,
    highlight: false,
    items: [
      ['Qoğal', 0.8], ['Simit', 1], ['Xaçapuri', 1.2], ['Cəmli bulka', 0.7],
      ['Kruassan', 1], ['Şirin qoğal', 0.8], ['Şor qoğal', 0.8], ['Popkorn', 0.7],
      ['Cini', 1.2], ['Tutku (böyük)', 1.2], ['Tutku (balaca)', 0.7],
      ['Biscolata (böyük)', 1.5], ['Biscolata (balaca)', 0.8], ['Benimo', 1.2],
      ['Biskrem (böyük)', 1.2], ['Biskrem (balaca)', 0.7], ['Çizi', 1],
      ['Hoşbeş', 0.7], ['Hoşbeş gofret', 1], ['Adicto keks', 0.7], ['Adicto', 1],
      ['Keks', 0.8], ['Türk paxlavası', 0.5], ['Çərəz', 0.7],
      ['Partlayan çərəz', 1], ['Sadə çərəz', 0.5], ['Kat-kat', 0.7],
      ['Ozmo oyun', 0.7], ['Ozmo (balaca)', 0.8], ['Skram', 1], ['Halley', 1.5],
      ['Snickers', 1.5], ['Twix', 1.5], ['Bounty', 1.5], ['Albeni', 1.2],
    ].map(([name, price], index) => ({
      id: 100300 + index + 1,
      category_id: 1003,
      name,
      price,
      sort_order: index + 1,
    })),
  },
  {
    id: 1004,
    name: 'İçkilər',
    sort_order: 4,
    highlight: false,
    items: [
      ['Çay', 0.3], ['Kofe', 0.5], ['Stəkan kola', 0.5], ['Ayran', 0.5],
      ['Natura sok', 0.6], ['Fuse Tea', 1], ['Cappy', 1], ['Su', 0.5],
      ['Cola', 1], ['Fanta', 1], ['Sprite', 1], ['Qızıl Quyu suları', 0.8],
    ].map(([name, price], index) => ({
      id: 100400 + index + 1,
      category_id: 1004,
      name,
      price,
      sort_order: index + 1,
    })),
  },
  {
    id: 1005,
    name: 'Digər',
    sort_order: 5,
    highlight: false,
    items: [{ id: 100501, category_id: 1005, name: 'Salfetka', price: 0.5, sort_order: 1 }],
  },
];

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
  if (req.query.version === '1') {
    return res.json({
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || 'dev',
      deployedAt: process.env.VERCEL_ENV ? new Date().toISOString() : null,
      buildId: process.env.VERCEL_DEPLOYMENT_ID || 'local',
    });
  }

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
    const cafeteriaItemCount = cafeteria.reduce((sum: number, category: any) => sum + category.items.length, 0);
    const visibleCafeteria = cafeteriaItemCount > 0 ? cafeteria : DEFAULT_CAFETERIA_MENU;

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
      cafeteria: hiddenSections.includes('cafeteria') ? [] : visibleCafeteria,
      info: hiddenSections.includes('info') ? [] : info,
      settings,
    };

    // Compute ETag from the full payload so changes after the JSON prefix are detected.
    const etag = createSyncEtag(result_data);
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
