import { useState, useEffect, useCallback, useRef } from 'react';
import type { KioskData } from './types';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const POLL_INTERVAL = 5000;

export function useKioskData() {
  const [data, setData] = useState<KioskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const etagRef = useRef<string>('');

  const fetchData = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (etagRef.current) {
        headers['If-None-Match'] = etagRef.current;
      }

      const res = await fetch(`${BASE_URL}/api/sync`, { headers });

      if (res.status === 304) return; // No changes

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const newData: KioskData = await res.json();
      etagRef.current = newData.etag;
      setData(newData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
