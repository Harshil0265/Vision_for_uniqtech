import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '../types';
import * as auth from '../lib/authClient';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  status: AuthStatus;
  user: User | null;
  /** 'api' = signed in through the .NET API. */
  mode: auth.AuthMode | null;
  /** True when a previous session ended because it expired or was rejected by the server. */
  sessionExpired: boolean;
  signIn: (email: string, password: string) => Promise<auth.AuthOutcome>;
  signUp: (data: auth.SignupInput) => Promise<auth.AuthOutcome>;
  signOut: () => Promise<void>;
  updateProfile: (patch: { name: string; role: string; department: string }) => Promise<auth.ActionOutcome>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<auth.ActionOutcome>;
  requestPasswordReset: (email: string) => Promise<auth.ActionOutcome>;
  resetPassword: (token: string, newPassword: string) => Promise<auth.ActionOutcome>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// setTimeout cannot hold delays above ~24.8 days; sessions are far shorter but stay safe.
const MAX_TIMER_MS = 2_000_000_000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<auth.AuthMode | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const apply = useCallback((next: User | null, expired = false) => {
    setUser(next);
    setMode(next ? auth.getSessionMode() : null);
    setStatus(next ? 'authenticated' : 'unauthenticated');
    setSessionExpired(!next && expired);
  }, []);

  // Restore the session on page load.
  useEffect(() => {
    // Remove the fake session left behind by the earlier Clerk-style demo auth.
    try { localStorage.removeItem('vision_clerk_session'); } catch { /* storage unavailable */ }

    let cancelled = false;
    auth.restoreSession().then(({ user: restored, expired }) => {
      if (!cancelled) apply(restored, expired);
    });
    // Signed out elsewhere (another tab, or the API answered 401).
    const off = auth.onAuthChange(next => apply(next, next === null));
    return () => { cancelled = true; off(); };
  }, [apply]);

  // End the session in the UI at the moment the token expires.
  useEffect(() => {
    if (status !== 'authenticated') return;
    const wait = auth.getSessionExpiry() - Date.now();
    if (wait <= 0) return;
    const timer = setTimeout(() => { void auth.logout(); apply(null, true); }, Math.min(wait, MAX_TIMER_MS));
    return () => clearTimeout(timer);
  }, [status, user?.id, apply]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await auth.login(email, password);
    if (result.status === 'authenticated') apply(result.user);
    return result;
  }, [apply]);

  const signUp = useCallback(async (data: auth.SignupInput) => {
    const result = await auth.signup(data);
    if (result.status === 'authenticated') apply(result.user);
    return result;
  }, [apply]);

  const signOut = useCallback(async () => {
    await auth.logout();
    apply(null);
  }, [apply]);

  const updateProfile = useCallback(async (patch: { name: string; role: string; department: string }) => {
    const { outcome, user: updated } = await auth.updateProfile(patch);
    if (updated) setUser(updated);
    return outcome;
  }, []);

  const value = useMemo(
    () => ({
      status, user, mode, sessionExpired, signIn, signUp, signOut, updateProfile,
      changePassword: auth.changePassword,
      requestPasswordReset: auth.requestPasswordReset,
      resetPassword: auth.resetPassword
    }),
    [status, user, mode, sessionExpired, signIn, signUp, signOut, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
