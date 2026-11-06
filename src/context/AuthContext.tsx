import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '../types';
import * as auth from '../lib/authClient';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type ActionResult = auth.AuthOutcome;

interface AuthContextType {
  status: AuthStatus;
  user: User | null;
  signIn: (email: string, password: string) => Promise<ActionResult>;
  signUp: (data: { name: string; email: string; password: string; role?: string; department?: string }) => Promise<ActionResult>;
  signOut: () => Promise<void>;
  signOutEverywhere: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Refresh a little before the access token expires so users never see a failed request.
const REFRESH_LEAD_MS = 60_000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const apply = useCallback((next: User | null) => {
    setUser(next);
    setStatus(next ? 'authenticated' : 'unauthenticated');
  }, []);

  // Restore the session on page load from the httpOnly refresh cookie.
  useEffect(() => {
    // Remove credentials stored by the previous (Clerk-era) implementation.
    try {
      ['vision_clerk_session', 'clerk_session_token'].forEach(k => localStorage.removeItem(k));
    } catch { /* storage unavailable */ }

    let cancelled = false;
    auth.refreshSession().then(session => {
      if (!cancelled) apply(session?.user ?? null);
    });
    const off = auth.onAuthChange(apply);
    return () => { cancelled = true; off(); };
  }, [apply]);

  // Keep the access token fresh while the user is signed in.
  useEffect(() => {
    if (status !== 'authenticated') return;

    const schedule = () => {
      clearTimeout(timer.current);
      const wait = Math.max(5_000, auth.getAccessTokenExpiry() - Date.now() - REFRESH_LEAD_MS);
      timer.current = setTimeout(async () => {
        const session = await auth.refreshSession();
        if (!session) apply(null);
        else schedule();
      }, wait);
    };
    schedule();

    // Timers are throttled in background tabs: re-check when the tab becomes visible again.
    const onVisible = async () => {
      if (document.visibilityState === 'visible' && Date.now() > auth.getAccessTokenExpiry() - REFRESH_LEAD_MS) {
        const session = await auth.refreshSession();
        if (!session) apply(null);
        else schedule();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [status, apply]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await auth.login(email, password);
    if (result.status === 'authenticated') apply(result.user);
    return result;
  }, [apply]);

  const signUp = useCallback(async (data: Parameters<typeof auth.signup>[0]) => {
    const result = await auth.signup(data);
    if (result.status === 'authenticated') apply(result.user);
    return result;
  }, [apply]);

  const signOut = useCallback(async () => {
    await auth.logout();
    apply(null);
  }, [apply]);

  const signOutEverywhere = useCallback(async () => {
    await auth.logoutAll();
    apply(null);
  }, [apply]);

  const value = useMemo(
    () => ({ status, user, signIn, signUp, signOut, signOutEverywhere }),
    [status, user, signIn, signUp, signOut, signOutEverywhere]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
