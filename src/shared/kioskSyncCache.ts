import type { KioskData } from './types';

const CACHE_KEY = 'kiosk_data_cache';

export const FULL_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const SIGNAL_POLL_INTERVAL_MS = 60 * 1000;

export interface CachedKioskData {
  data: KioskData;
  syncedAt: number;
  syncRequestedAt: string | null;
}

export function getCachedKioskData(storage: Storage): CachedKioskData | null {
  const raw = storage.getItem(CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachedKioskData;
    if (!parsed?.data || typeof parsed.syncedAt !== 'number') return null;
    return {
      data: parsed.data,
      syncedAt: parsed.syncedAt,
      syncRequestedAt: parsed.syncRequestedAt ?? null,
    };
  } catch {
    storage.removeItem(CACHE_KEY);
    return null;
  }
}

export function saveCachedKioskData(storage: Storage, data: KioskData, syncedAt: number, syncRequestedAt: string | null) {
  storage.setItem(CACHE_KEY, JSON.stringify({ data, syncedAt, syncRequestedAt }));
}

export function isFullSyncDue(cached: CachedKioskData | null, now: number) {
  if (!cached) return true;
  return now - cached.syncedAt >= FULL_SYNC_INTERVAL_MS;
}

export function isRemoteSyncRequested(remoteSyncRequestedAt: string | null | undefined, cachedSyncRequestedAt: string | null | undefined) {
  if (!remoteSyncRequestedAt) return false;
  return remoteSyncRequestedAt !== cachedSyncRequestedAt;
}
