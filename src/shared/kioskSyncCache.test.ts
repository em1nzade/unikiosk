import assert from 'node:assert/strict';
import {
  FULL_SYNC_INTERVAL_MS,
  SIGNAL_POLL_INTERVAL_MS,
  getCachedKioskData,
  isFullSyncDue,
  isRemoteSyncRequested,
  getKioskSyncEtagHeader,
  saveCachedKioskData,
} from './kioskSyncCache';
import type { KioskData } from './types';

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
  removeItem: (key: string) => { storage.delete(key); },
} as Storage;

const sampleData: KioskData = {
  announcements: [],
  faculties: [],
  schedules: [],
  events: [],
  cafeteria: [],
  info: [],
  settings: {
    ticker_enabled: true,
    ticker_mode: 'scroll',
    ticker_pinned_id: null,
    default_language: 'az',
  },
  etag: 'abc',
};

assert.equal(FULL_SYNC_INTERVAL_MS, 24 * 60 * 60 * 1000);
assert.equal(SIGNAL_POLL_INTERVAL_MS, 60 * 1000);

storage.clear();
saveCachedKioskData(localStorageMock, sampleData, 1_000, 'request-a');
assert.deepEqual(getCachedKioskData(localStorageMock), {
  data: sampleData,
  syncedAt: 1_000,
  syncRequestedAt: 'request-a',
});

assert.equal(isFullSyncDue(null, 2_000), true);
assert.equal(isFullSyncDue({ data: sampleData, syncedAt: 1_000, syncRequestedAt: null }, 1_000 + FULL_SYNC_INTERVAL_MS - 1), false);
assert.equal(isFullSyncDue({ data: sampleData, syncedAt: 1_000, syncRequestedAt: null }, 1_000 + FULL_SYNC_INTERVAL_MS), true);

assert.equal(isRemoteSyncRequested('request-b', 'request-a'), true);
assert.equal(isRemoteSyncRequested('request-a', 'request-a'), false);
assert.equal(isRemoteSyncRequested(null, 'request-a'), false);

assert.equal(getKioskSyncEtagHeader(false, 'etag-a'), 'etag-a');
assert.equal(getKioskSyncEtagHeader(false, ''), undefined);
assert.equal(getKioskSyncEtagHeader(true, 'etag-a'), undefined);

storage.set('kiosk_data_cache', '{bad json');
assert.equal(getCachedKioskData(localStorageMock), null);

console.log('kiosk sync cache helpers ok');
