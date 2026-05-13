import { createHash } from 'node:crypto';

export function createSyncEtag(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}
