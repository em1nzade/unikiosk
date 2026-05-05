import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const adminEmail = process.env.ADMIN_EMAIL || 'admin@oyu.edu.az';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
const superadminPermissions = [
  'dashboard',
  'announcements',
  'faculties',
  'schedules',
  'events',
  'cafeteria',
  'info',
  'feedback',
  'settings',
  'users',
  'devices',
];

await sql`
  CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`;
console.log('Table created');

try {
  await sql`ALTER TABLE admin_users ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb`;
  console.log('Permissions column added');
} catch (err) {
  if (!String(err?.message || err).includes('already exists')) {
    throw err;
  }
}

const hash = await bcrypt.hash(adminPassword, 10);
await sql`
  INSERT INTO admin_users (email, password_hash, name, role, active, permissions)
  VALUES (${adminEmail}, ${hash}, 'Admin', 'superadmin', true, ${JSON.stringify(superadminPermissions)})
  ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    active = true,
    permissions = EXCLUDED.permissions,
    updated_at = NOW()
`;
console.log(`Admin user upserted and password reset for ${adminEmail}`);

const rows = await sql`SELECT id, email, name, role, active FROM admin_users`;
console.log('Users:', JSON.stringify(rows));
