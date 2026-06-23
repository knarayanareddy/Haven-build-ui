import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { useHavenClient } from './useHavenClient';
import { OfflineSyncMachine } from '../state/offlineSyncMachine';

/**
 * Wires the OfflineSyncMachine to drain when network comes back online.
 * Pings Supabase health endpoint to detect connectivity, then triggers
 * a drain of queued offline actions through HavenClient.
 */
export function useOfflineSync() {
  const client = useHavenClient();
  const { session } = useAuth();
  const machineRef = useRef(new OfflineSyncMachine());
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!client || !session) return;
    let mounted = true;

    async function checkAndDrain() {
      if (!mounted || !client) return;
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!url) return;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${url}/rest/v1/`, {
          method: 'HEAD',
          signal: controller.signal,
          headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '' },
        });
        clearTimeout(timer);

        const isOnline = res.ok || res.status === 401;
        if (isOnline && wasOfflineRef.current) {
          machineRef.current.reset();
          await machineRef.current.sync(client);
        }
        if (!isOnline) {
          machineRef.current.pauseOffline();
        }
        wasOfflineRef.current = !isOnline;
      } catch {
        wasOfflineRef.current = true;
        machineRef.current.pauseOffline();
      }
    }

    // Initial drain attempt on mount
    machineRef.current.sync(client).catch(() => {});

    const interval = setInterval(checkAndDrain, 30_000);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkAndDrain();
    });

    return () => {
      mounted = false;
      clearInterval(interval);
      sub.remove();
    };
  }, [client, session]);
}
