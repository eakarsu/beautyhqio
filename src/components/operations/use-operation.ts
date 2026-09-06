'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
export function useOperation<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const attempt = useRef<{ body: string; key: string } | null>(null);
  const loading = useRef(false);
  const load = useCallback(async () => {
    setError('');
    try {
      const r = await fetch(url, { cache: 'no-store' });
      const value = await r.json();
      if (!r.ok) throw new Error(value.error || 'Unable to load records');
      setData(value);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load records'); }
  }, [url]);
  useEffect(() => { void load(); }, [load]);
  async function save(input: unknown) {
    if (loading.current) return false;
    loading.current = true; setBusy(true); setError('');
    const body = JSON.stringify(input);
    if (attempt.current?.body !== body) attempt.current = { body, key: crypto.randomUUID() };
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.current.key }, body });
      const value = await r.json();
      if (!r.ok) throw new Error(value.error || 'Unable to save');
      attempt.current = null;
      await load(); return true;
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save'); return false; }
    finally { loading.current = false; setBusy(false); }
  }
  return { data, error, busy, load, save };
}
