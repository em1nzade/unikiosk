import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

console.log('=== Bootstrapping kiosk database ===');

await sql`CREATE TABLE IF NOT EXISTS faculties (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  faculty_id INT NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`CREATE TABLE IF NOT EXISTS dept_content (
  id SERIAL PRIMARY KEY,
  department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('schedule', 'announcement', 'exam')),
  course_year INT CHECK (course_year IS NULL OR course_year BETWEEN 1 AND 4),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  faculty_id INT NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  course_year INT NOT NULL CHECK (course_year BETWEEN 1 AND 4),
  sector VARCHAR(10) NOT NULL DEFAULT 'az',
  groups JSONB NOT NULL DEFAULT '[]'::jsonb,
  cells JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(faculty_id, course_year, sector)
)`;

await sql`CREATE TABLE IF NOT EXISTS announcement_types (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  importance TEXT NOT NULL CHECK (importance IN ('high', 'medium', 'low')),
  date DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  faculty_id INT REFERENCES faculties(id) ON DELETE SET NULL,
  image_url TEXT,
  table_headers JSONB NOT NULL DEFAULT '[]'::jsonb,
  table_rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  theme TEXT NOT NULL DEFAULT 'neutral',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT`;
await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS table_headers JSONB NOT NULL DEFAULT '[]'::jsonb`;
await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS table_rows JSONB NOT NULL DEFAULT '[]'::jsonb`;
await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'neutral'`;

await sql`CREATE TABLE IF NOT EXISTS event_types (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`CREATE TABLE IF NOT EXISTS cafeteria_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  highlight BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`CREATE TABLE IF NOT EXISTS cafeteria_items (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES cafeteria_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC,
  sort_order INT NOT NULL DEFAULT 0,
  menu_date DATE DEFAULT CURRENT_DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`CREATE TABLE IF NOT EXISTS info_content (
  id SERIAL PRIMARY KEY,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`CREATE TABLE IF NOT EXISTS kiosk_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`CREATE TABLE IF NOT EXISTS kiosk_devices (
  id SERIAL PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Kiosk',
  floor TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  hidden_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  active BOOLEAN NOT NULL DEFAULT true,
  permissions JSONB NOT NULL DEFAULT '["dashboard","announcements","faculties","schedules","events","cafeteria","info","settings"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`INSERT INTO kiosk_settings (key, value) VALUES
  ('ticker_enabled', 'true'::jsonb),
  ('ticker_mode', '"scroll"'::jsonb),
  ('ticker_pinned_id', 'null'::jsonb),
  ('default_language', '"az"'::jsonb),
  ('sleep_screen_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING`;

await sql`INSERT INTO announcement_types (name)
VALUES ('Məlumat'), ('Xəbərdarlıq'), ('Təcili')
ON CONFLICT (name) DO NOTHING`;

await sql`INSERT INTO event_types (name)
VALUES ('Konfrans'), ('Seminar'), ('Tədbir'), ('Workshop')
ON CONFLICT (name) DO NOTHING`;

await sql`INSERT INTO info_content (section, title, content, sort_order)
VALUES
  ('about', 'Universitet haqqında', 'Odlar Yurdu Universiteti 1995-ci ildə yaradılmış müasir ali təhsil müəssisəsidir.', 1),
  ('contact', 'Əlaqə', 'Ünvan: Koroğlu Rəhimov küçəsi 13, Bakı AZ1130 | Telefon: +994 12 465 82 00 | Email: info@oyu.edu.az', 2)
ON CONFLICT DO NOTHING`;

const explicitAdminPassword = Boolean(process.env.ADMIN_PASSWORD);
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
const hash = await bcrypt.hash(adminPassword, 10);
await sql`INSERT INTO admin_users (email, password_hash, name, role, permissions)
VALUES (
  'admin@oyu.edu.az',
  ${hash},
  'Admin',
  'superadmin',
  '["dashboard","announcements","faculties","schedules","events","cafeteria","info","settings","users"]'::jsonb
)
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  password_hash = CASE
    WHEN ${explicitAdminPassword} THEN EXCLUDED.password_hash
    ELSE admin_users.password_hash
  END,
  updated_at = NOW()`;

console.log('=== Database bootstrap complete ===');
