import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_lRcmopiQH25C@ep-square-scene-altol7k9.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require');

console.log('=== Setting up V2 tables ===');

// 1. Kiosk Settings
await sql`CREATE TABLE IF NOT EXISTS kiosk_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
)`;
console.log('✓ kiosk_settings table');

await sql`INSERT INTO kiosk_settings (key, value) VALUES
  ('ticker_enabled', 'true'),
  ('ticker_mode', '"scroll"'),
  ('ticker_pinned_id', 'null'),
  ('default_language', '"az"')
ON CONFLICT (key) DO NOTHING`;
console.log('✓ default settings seeded');

// 2. Announcement Types
await sql`CREATE TABLE IF NOT EXISTS announcement_types (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)`;
console.log('✓ announcement_types table');

await sql`INSERT INTO announcement_types (name) VALUES ('Məlumat'), ('Xəbərdarlıq'), ('Təcili') ON CONFLICT (name) DO NOTHING`;
console.log('✓ default announcement types seeded');

// 3. Event Types
await sql`CREATE TABLE IF NOT EXISTS event_types (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)`;
console.log('✓ event_types table');

await sql`INSERT INTO event_types (name) VALUES ('Konfrans'), ('Seminar'), ('Tədbir'), ('Workshop') ON CONFLICT (name) DO NOTHING`;
console.log('✓ default event types seeded');

// 4. Add permissions column to admin_users
try {
  await sql`ALTER TABLE admin_users ADD COLUMN permissions JSONB DEFAULT '["dashboard","announcements","exams","events","cafeteria","info","settings"]'::jsonb`;
  console.log('✓ permissions column added to admin_users');
} catch (e) {
  if (e.message?.includes('already exists')) {
    console.log('✓ permissions column already exists');
  } else {
    throw e;
  }
}

// 5. Make sure superadmin has all permissions including users
await sql`UPDATE admin_users SET permissions = '["dashboard","announcements","exams","events","cafeteria","info","settings","users"]'::jsonb WHERE role = 'superadmin'`;
console.log('✓ superadmin permissions updated');

// 6. Add menu_date column to cafeteria_items for daily tracking
try {
  await sql`ALTER TABLE cafeteria_items ADD COLUMN menu_date DATE DEFAULT CURRENT_DATE`;
  console.log('✓ menu_date column added to cafeteria_items');
} catch (e) {
  if (e.message?.includes('already exists')) {
    console.log('✓ menu_date column already exists');
  } else {
    throw e;
  }
}

console.log('\n=== V2 setup complete ===');
