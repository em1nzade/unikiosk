import { useState, useEffect, useCallback, useRef } from 'react';
import type { KioskData } from './types';

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
const POLL_INTERVAL = 5000;
const OFFLINE_DATA: KioskData = {
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
    sleep_screen_enabled: false,
  },
  etag: 'offline',
};

export function useKioskData() {
  const [data, setData] = useState<KioskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const etagRef = useRef<string>('');
  const deviceIdRef = useRef<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (etagRef.current) headers['If-None-Match'] = etagRef.current;
      const params = deviceIdRef.current ? `?device=${deviceIdRef.current}` : '';
      const res = await fetch(`${BASE_URL}/api/sync${params}`, { headers });
      if (res.status === 304) return;
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const newData: KioskData = await res.json();
      etagRef.current = newData.etag;
      setData(newData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setData(current => current ?? OFFLINE_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get device ID from Electron first (await IPC), then start polling
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval>;

    async function init() {
      if (window.kioskAPI?.getDeviceId) {
        try {
          const id = await window.kioskAPI.getDeviceId();
          if (!cancelled) deviceIdRef.current = id;
        } catch {}
      }
      if (!cancelled) {
        fetchData();
        interval = setInterval(fetchData, POLL_INTERVAL);
      }
    }

    init();
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
