import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// List all tables
const tables = await sql`SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name`;
console.log('=== TABLES ===');
tables.forEach(t => console.log(`${t.table_schema}.${t.table_name}`));

// Check each content table
async function checkTable(name, rows) {
  for (const row of rows) {
    const json = JSON.stringify(row);
    if (json.includes('Bakı') || json.includes('Dövlət') || json.includes('BSU') || json.includes('bsu')) {
      console.log(`\n=== FOUND in ${name} ===`);
      console.log(JSON.stringify(row, null, 2));
    }
  }
}

const announcements = await sql`SELECT * FROM announcements`;
await checkTable('announcements', announcements);

const cafCats = await sql`SELECT * FROM cafeteria_categories`;
await checkTable('cafeteria_categories', cafCats);

const cafItems = await sql`SELECT * FROM cafeteria_items`;
await checkTable('cafeteria_items', cafItems);

const events = await sql`SELECT * FROM events`;
await checkTable('events', events);

const exams = await sql`SELECT * FROM exams`;
await checkTable('exams', exams);

const info = await sql`SELECT * FROM info_content`;
await checkTable('info_content', info);

const kiosks = await sql`SELECT * FROM kiosks`;
await checkTable('kiosks', kiosks);

console.log('\n=== DONE ===');

// Fix old names
console.log('\n=== FIXING info_content ===');

await sql`UPDATE info_content SET content = 'Odlar Yurdu Universiteti 1995-ci ildə yaradılmış müasir ali təhsil müəssisəsidir.', updated_at = NOW() WHERE id = 4`;
console.log('Fixed id=4 (about)');

await sql`UPDATE info_content SET content = 'Ünvan: Koroğlu Rəhimov küçəsi 13, Bakı AZ1130 | Telefon: +994 12 465 82 00 | Email: info@oyu.edu.az', updated_at = NOW() WHERE id = 5`;
console.log('Fixed id=5 (contact)');

// Verify
const verify = await sql`SELECT id, title, content FROM info_content WHERE id IN (4,5)`;
verify.forEach(r => console.log(JSON.stringify(r, null, 2)));
