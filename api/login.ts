import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { SignJWT } from 'jose';
import { timingSafeEqual } from 'crypto';
import { compare } from 'bcryptjs';

function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';
  if (origin.endsWith('.vercel.app') || origin.startsWith('http://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const users = await sql`SELECT * FROM admin_users WHERE email = ${email} AND active = true LIMIT 1`;
    if (users.length === 0) return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });

    const user = users[0];
    const valid = await compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });

    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
    const jwt = await new SignJWT({ sub: String(user.id), email: user.email, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(secret);

    return res.json({ token: jwt, user: { id: user.id, email: user.email, name: user.name, role: user.role, permissions: user.permissions || [] } });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
