import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_CAFETERIA_MENU } from './defaultCafeteriaMenu';
import type { KioskData } from './types';
import {
  FULL_SYNC_INTERVAL_MS,
  SIGNAL_POLL_INTERVAL_MS,
  getCachedKioskData,
  getKioskSyncEtagHeader,
  isFullSyncDue,
  isRemoteSyncRequested,
  saveCachedKioskData,
} from './kioskSyncCache';

declare global {
  interface Window {
    kioskAPI?: {
      isKiosk: boolean;
      platform?: string;
      verifyPin: (pin: string) => Promise<boolean>;
      exitApp: () => Promise<void>;
      getDeviceId: () => Promise<string>;
      [key: string]: any;
    };
  }
}

const BASE_URL = import.meta.env.VITE_API_URL || '';
const OFFLINE_DATA: KioskData = {
  announcements: [],
  faculties: [],
  schedules: [],
  events: [],
  cafeteria: DEFAULT_CAFETERIA_MENU,
  info: [],
  settings: {
    ticker_enabled: true,
    ticker_mode: 'scroll',
    ticker_pinned_id: null,
    default_language: 'az',
    sleep_screen_enabled: false,
  },
  etag: 'offline',
};

export function useKioskData() {
  const [data, setData] = useState<KioskData | null>(() => getCachedKioskData(localStorage)?.data ?? null);
  const [loading, setLoading] = useState(() => !getCachedKioskData(localStorage));
  const [error, setError] = useState<string | null>(null);
  const cachedRef = useRef(getCachedKioskData(localStorage));
  const etagRef = useRef<string>(cachedRef.current?.data.etag ?? '');
  const deviceIdRef = useRef<string | null>(null);

  const fetchData = useCallback(async (force = false, requestedSyncAt?: string | null) => {
    const cached = cachedRef.current;
    if (!force && !isFullSyncDue(cached, Date.now())) {
      setLoading(false);
      return;
    }

    try {
      const headers: Record<string, string> = {};
      const etagHeader = getKioskSyncEtagHeader(force, etagRef.current);
      if (etagHeader) headers['If-None-Match'] = etagHeader;
      const params = deviceIdRef.current ? `?device=${deviceIdRef.current}` : '';
      const res = await fetch(`${BASE_URL}/api/sync${params}`, { headers });
      if (res.status === 304) {
        if (cached) {
          const next = { ...cached, syncedAt: Date.now(), syncRequestedAt: requestedSyncAt ?? cached.syncRequestedAt };
          cachedRef.current = next;
          saveCachedKioskData(localStorage, next.data, next.syncedAt, next.syncRequestedAt);
        }
        return;
      }
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const newData: KioskData = await res.json();
      etagRef.current = newData.etag;
      const syncRequestedAt = typeof newData.settings?.sync_requested_at === 'string'
        ? newData.settings.sync_requested_at
        : requestedSyncAt ?? cached?.syncRequestedAt ?? null;
      cachedRef.current = { data: newData, syncedAt: Date.now(), syncRequestedAt };
      saveCachedKioskData(localStorage, newData, cachedRef.current.syncedAt, syncRequestedAt);
      setData(newData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setData(current => current ?? cached?.data ?? OFFLINE_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSyncSignal = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/settings?action=sync-signal`);
      if (!res.ok) return;
      const body = await res.json();
      const remoteSyncRequestedAt = typeof body.sync_requested_at === 'string' ? body.sync_requested_at : null;
      if (isRemoteSyncRequested(remoteSyncRequestedAt, cachedRef.current?.syncRequestedAt)) {
        await fetchData(true, remoteSyncRequestedAt);
      }
    } catch {}
  }, [fetchData]);

  // Get device ID from Electron first (await IPC), then use cached data with low-frequency refreshes.
  useEffect(() => {
    let cancelled = false;
    let fullSyncInterval: ReturnType<typeof setInterval>;
    let signalInterval: ReturnType<typeof setInterval>;

    async function init() {
      if (window.kioskAPI?.getDeviceId) {
        try {
          const id = await window.kioskAPI.getDeviceId();
          if (!cancelled) deviceIdRef.current = id;
        } catch {}
      }
      if (!cancelled) {
        await fetchData();
        await checkSyncSignal();
        fullSyncInterval = setInterval(() => fetchData(), FULL_SYNC_INTERVAL_MS);
        signalInterval = setInterval(checkSyncSignal, SIGNAL_POLL_INTERVAL_MS);
      }
    }

    init();
    return () => {
      cancelled = true;
      clearInterval(fullSyncInterval);
      clearInterval(signalInterval);
    };
  }, [checkSyncSignal, fetchData]);

  return { data, loading, error, refetch: () => fetchData(true) };
}
