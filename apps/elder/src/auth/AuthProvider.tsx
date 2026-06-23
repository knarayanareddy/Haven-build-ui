import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@haven/database/src/types';
import { HavenClient } from '../services/havenClient';
import { registerPushToken, addNotificationListeners } from '../services/pushTokenService';

const SESSION_KEY = 'haven.secure.supabase.session';

type AuthContextValue = {
  supabase: SupabaseClient<Database>;
  session: Session | null;
  isReady: boolean;
  signInWithOtp: (emailOrPhone: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';
    return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: true } });
  }, []);
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    SecureStore.getItemAsync(SESSION_KEY).then(async (stored: string | null) => {
      if (!mounted) return;
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Session;
          setSession(parsed);
          await supabase.auth.setSession({ access_token: parsed.access_token, refresh_token: parsed.refresh_token });
        } catch {
          await SecureStore.deleteItemAsync(SESSION_KEY);
        }
      }
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange(async (_event: string, next: Session | null) => {
      setSession(next);
      if (next) await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(next), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
      else await SecureStore.deleteItemAsync(SESSION_KEY);
    });
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, [supabase]);

  async function signInWithOtp(emailOrPhone: string) {
    if (emailOrPhone.includes('@')) await supabase.auth.signInWithOtp({ email: emailOrPhone });
    else await supabase.auth.signInWithOtp({ phone: emailOrPhone });
  }

  // Register push token when session becomes available
  const pushRegistered = useRef(false);
  useEffect(() => {
    if (!session || pushRegistered.current) return;
    pushRegistered.current = true;
    // Extract user ID from JWT sub claim
    let userId: string | null = null;
    try {
      const [, payload] = session.access_token.split('.');
      userId = JSON.parse(atob(payload))?.sub ?? null;
    } catch { /* skip */ }
    if (!userId) return;
    const client = new HavenClient({ supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!, accessToken: session.access_token });
    registerPushToken(client, userId).catch(() => {});
    const cleanup = addNotificationListeners();
    return cleanup;
  }, [session]);

  async function signOut() {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setSession(null);
    pushRegistered.current = false;
  }

  return <AuthContext.Provider value={{ supabase, session, isReady, signInWithOtp, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
