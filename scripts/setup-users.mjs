import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon('postgresql://neondb_owner:npg_lRcmopiQH25C@ep-square-scene-altol7k9.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require');

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

const hash = await bcrypt.hash('Admin123!', 10);
await sql`INSERT INTO admin_users (email, password_hash, name, role) VALUES ('admin@oyu.edu.az', ${hash}, 'Admin', 'superadmin') ON CONFLICT (email) DO NOTHING`;
console.log('Default admin inserted');

const rows = await sql`SELECT id, email, name, role, active FROM admin_users`;
console.log('Users:', JSON.stringify(rows));
