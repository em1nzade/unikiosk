import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const title = 'XRİTDX master classları';
const description = 'Odlar Yurdu Universiteti ilə Xüsusi Rabitə və İnformasiya Təhlükəsizliyi Dövlət Xidməti (XRİTDX) arasında bağlanmış protokola uyğun olaraq OYU konfrans salonunda master classlar təşkil edilir. İmtahanı və dərsi olmayan bütün müəllim və tələbələrin qatılması məcburidir.';
const tableHeaders = ['N0', 'Mövzu', 'Aparıcı', 'Tarix və saat'];
const tableRows = [
  ['1', 'Tətbiqlərin performans testləri', 'Dilqəm Məmmədov', '06 May 2026 12:00'],
  ['2', 'Rəqəmsal ekspertiza: yanaşmalar və tətbiq', 'Sabine Tağıyeva', '15 May 2026 12:00'],
  ['3', 'Təhdid kəşfiyyatı', 'Günay Əbdiyeva-Əliyeva', '21 May 2026 12:00'],
];

await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT`;
await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS table_headers JSONB NOT NULL DEFAULT '[]'::jsonb`;
await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS table_rows JSONB NOT NULL DEFAULT '[]'::jsonb`;
await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'neutral'`;

const existing = await sql`SELECT id FROM announcements WHERE title = ${title} ORDER BY id DESC LIMIT 1`;

if (existing[0]) {
  await sql`UPDATE announcements SET
    description = ${description},
    type = 'Tədbir',
    importance = 'high',
    date = '2026-05-06',
    active = true,
    image_url = NULL,
    table_headers = ${JSON.stringify(tableHeaders)}::jsonb,
    table_rows = ${JSON.stringify(tableRows)}::jsonb,
    theme = 'blue',
    updated_at = NOW()
    WHERE id = ${existing[0].id}`;
  console.log(`Updated announcement #${existing[0].id}: ${title}`);
} else {
  const rows = await sql`INSERT INTO announcements (title, description, type, importance, date, active, image_url, table_headers, table_rows, theme)
    VALUES (${title}, ${description}, 'Tədbir', 'high', '2026-05-06', true, NULL, ${JSON.stringify(tableHeaders)}::jsonb, ${JSON.stringify(tableRows)}::jsonb, 'blue')
    RETURNING id`;
  console.log(`Inserted announcement #${rows[0].id}: ${title}`);
}
