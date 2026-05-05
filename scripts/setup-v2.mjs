import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

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
  ('default_language', '"az"'),
  ('sleep_screen_enabled', 'false')
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

// 4. Feedback messages
await sql`CREATE TABLE IF NOT EXISTS feedback_messages (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'teklif' CHECK (category IN ('teklif', 'irad')),
  message TEXT NOT NULL,
  name TEXT,
  contact TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read')),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)`;
console.log('✓ feedback_messages table');

// 5. Add permissions column to admin_users
try {
  await sql`ALTER TABLE admin_users ADD COLUMN permissions JSONB DEFAULT '["dashboard","announcements","faculties","schedules","events","cafeteria","info","feedback","settings"]'::jsonb`;
  console.log('✓ permissions column added to admin_users');
} catch (e) {
  if (e.message?.includes('already exists')) {
    console.log('✓ permissions column already exists');
  } else {
    throw e;
  }
}

// 6. Make sure superadmin has all permissions including users
await sql`UPDATE admin_users SET permissions = '["dashboard","announcements","faculties","schedules","events","cafeteria","info","feedback","settings","users","devices"]'::jsonb WHERE role = 'superadmin'`;
console.log('✓ superadmin permissions updated');

// 7. Add menu_date column to cafeteria_items for daily tracking
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

// 8. Announcement rich content columns
await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT`;
await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS table_headers JSONB NOT NULL DEFAULT '[]'::jsonb`;
await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS table_rows JSONB NOT NULL DEFAULT '[]'::jsonb`;
await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'neutral'`;
console.log('✓ announcement rich content columns ready');

console.log('\n=== V2 setup complete ===');
