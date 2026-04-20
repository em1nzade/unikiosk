import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT 1 as test`;
    return res.json({ 
      status: 'ok', 
      db: 'connected',
      result: result[0],
    });
  } catch (err: any) {
    return res.status(500).json({ 
      status: 'error', 
      error: err.message,
      stack: err.stack,
    });
  }
}
