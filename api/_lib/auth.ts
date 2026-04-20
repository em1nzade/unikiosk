import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS_URL = process.env.JWKS_URL || '';
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export async function verifyAdmin(req: VercelRequest): Promise<{ sub: string; email: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      algorithms: ['RS256'],
    });
    if (payload.sub && payload.email) {
      return { sub: payload.sub as string, email: payload.email as string };
    }
    return null;
  } catch {
    return null;
  }
}

export function unauthorized(res: VercelResponse) {
  return res.status(401).json({ error: 'Unauthorized' });
}
