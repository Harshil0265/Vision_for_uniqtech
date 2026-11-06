/**
 * Browser side of JWT auth.
 *
 *  - The short-lived access token lives ONLY in memory (not localStorage), so XSS cannot read a
 *    long-lived credential. The refresh token is an httpOnly cookie JavaScript cannot see.
 *  - apiFetch() attaches the access token, silently refreshes it when it is about to expire (or the
 *    server says it did), and retries the request once.
 *  - Refreshes are single-flight per tab and serialised across tabs with the Web Locks API, because
 *    refresh tokens rotate and two tabs must not spend the same one.
 */

import type { User } from '../types';

export interface SessionInfo {
  id: string;
  userAgent: string;
  ip: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
}

interface AuthPayload {
  accessToken: string;
  expiresIn: number;
  user: User;
}

type AuthListener = (user: User | null) => void;

const CSRF_HEADER = { 'X-Requested-With': 'vision-web' };
const EXPIRY_SKEW_MS = 15_000;

let accessToken: string | null = null;
let accessExpiresAt = 0;
let inflightRefresh: Promise<AuthPayload | null> | null = null;
const listeners = new Set<AuthListener>();

const channel: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('vision-auth') : null;

export const onAuthChange = (fn: AuthListener) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};
const emit = (user: User | null) => listeners.forEach(fn => fn(user));

function setSession(payload: AuthPayload | null) {
  accessToken = payload?.accessToken ?? null;
  accessExpiresAt = payload ? Date.now() + payload.expiresIn * 1000 : 0;
}

export const getAccessTokenExpiry = () => accessExpiresAt;

// Another tab signed out or in: mirror it here.
channel?.addEventListener('message', async (e: MessageEvent) => {
  if (e.data === 'logout') {
    setSession(null);
    emit(null);
  } else if (e.data === 'login' && !accessToken) {
    const session = await refreshSession();
    emit(session?.user ?? null);
  }
});

async function postJson<T = any>(path: string, body?: unknown, headers: Record<string, string> = {}): Promise<{ status: number; data: T }> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...CSRF_HEADER, ...headers },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data: data as T };
}

async function doRefresh(): Promise<AuthPayload | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { status, data } = await postJson<any>('/api/auth/refresh');
    if (status === 200 && data.accessToken) {
      setSession(data);
      return data as AuthPayload;
    }
    // Another tab rotated the cookie a moment ago; the browser already has the new one, so retry.
    if (status === 409 && data.code === 'refresh_race') {
      await new Promise(r => setTimeout(r, 250 * (attempt + 1)));
      continue;
    }
    break;
  }
  setSession(null);
  return null;
}

/** Exchanges the refresh cookie for a new access token. Returns null when signed out. */
export function refreshSession(): Promise<AuthPayload | null> {
  if (!inflightRefresh) {
    const run = () => doRefresh();
    const locked = typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request('vision-auth-refresh', run)
      : run();
    inflightRefresh = Promise.resolve(locked).finally(() => { inflightRefresh = null; });
  }
  return inflightRefresh;
}

/** fetch() for authenticated API calls. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  if (!accessToken || Date.now() > accessExpiresAt - EXPIRY_SKEW_MS) {
    const session = await refreshSession();
    if (!session) {
      emit(null);
      return new Response(JSON.stringify({ success: false, code: 'no_session', error: 'Please sign in again.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  const send = () => {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    return fetch(input, { ...init, headers });
  };

  let res = await send();
  if (res.status === 401) {
    // The server may have rejected a token our clock thought was fine (expired / session revoked).
    const session = await refreshSession();
    if (!session) {
      emit(null);
      return res;
    }
    res = await send();
  }
  return res;
}

// ---------------------------------------------------------------------------
// Account actions
// ---------------------------------------------------------------------------

export type AuthOutcome =
  | { status: 'authenticated'; user: User }
  | { status: 'error'; error: string; code?: string };

async function authenticate(path: string, body: unknown): Promise<AuthOutcome> {
  try {
    const { status, data } = await postJson<any>(path, body);
    if ((status === 200 || status === 201) && data.accessToken) {
      setSession(data);
      channel?.postMessage('login');
      return { status: 'authenticated', user: data.user };
    }
    return { status: 'error', error: data.error || 'Something went wrong. Please try again.', code: data.code };
  } catch {
    return { status: 'error', error: 'Cannot reach the server. Check your connection and try again.' };
  }
}

export const login = (email: string, password: string) => authenticate('/api/auth/login', { email, password });

export const signup = (data: { name: string; email: string; password: string; role?: string; department?: string }) =>
  authenticate('/api/auth/signup', data);

export async function logout(): Promise<void> {
  try {
    await postJson('/api/auth/logout');
  } catch { /* the local session is cleared regardless */ }
  setSession(null);
  channel?.postMessage('logout');
}

export async function logoutAll(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout-all', { method: 'POST', headers: CSRF_HEADER });
  } catch { /* ignore */ }
  setSession(null);
  channel?.postMessage('logout');
}

export async function listSessions(): Promise<SessionInfo[]> {
  const res = await apiFetch('/api/auth/sessions');
  const data = await res.json().catch(() => ({}));
  return res.ok && Array.isArray(data.sessions) ? data.sessions : [];
}

export async function revokeSession(id: string): Promise<boolean> {
  const res = await apiFetch(`/api/auth/sessions/${encodeURIComponent(id)}`, { method: 'DELETE', headers: CSRF_HEADER });
  return res.ok;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const res = await apiFetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...CSRF_HEADER },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { success: true } : { success: false, error: data.error || 'Could not change password.' };
}
