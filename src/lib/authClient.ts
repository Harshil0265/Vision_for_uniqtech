/**
 * Browser side of authentication. Talks to the Vision .NET API (/api/auth/*, see docs/API_CONTRACT.md).
 *
 *  - The API returns a signed JWT on sign-in / sign-up. It is kept in localStorage with the user so a
 *    reload keeps you signed in, and is sent as `Authorization: Bearer <token>` by apiFetch().
 *  - Auth mode (VITE_AUTH_MODE):
 *      'api'   always use the .NET API (default for production builds)
 *      'local' always use offline demo accounts in this browser (lib/localAuth.ts)
 *      'auto'  use the API, but fall back to offline demo accounts when the API cannot be reached
 *              (default for `npm run dev`, so the UI works before the backend is running)
 */

import type { User } from '../types';
import {
  localChangePassword,
  localFindUser,
  localLogin,
  localSignup,
  localUpdateProfile
} from './localAuth';

export type AuthMode = 'api' | 'local';
type ConfiguredMode = 'auto' | 'api' | 'local';

const configured = (import.meta.env.VITE_AUTH_MODE || '').toLowerCase();
export const CONFIGURED_AUTH_MODE: ConfiguredMode =
  configured === 'api' || configured === 'local' || configured === 'auto'
    ? configured
    : import.meta.env.DEV ? 'auto' : 'api';

const STORAGE_KEY = 'vision_auth_session';

interface StoredSession {
  token: string;
  user: User;
  mode: AuthMode;
}

export type AuthOutcome =
  | { status: 'authenticated'; user: User; mode: AuthMode }
  | { status: 'error'; error: string; code?: string };

/** Result of an account action (profile, password, reset). `unavailable` = the API has no such endpoint yet. */
export type ActionOutcome =
  | { status: 'ok'; message?: string }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string };

type AuthListener = (user: User | null) => void;

let session: StoredSession | null = readStored();
const listeners = new Set<AuthListener>();

export const onAuthChange = (fn: AuthListener) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};
const emit = (user: User | null) => listeners.forEach(fn => fn(user));

// Another tab signed in or out: mirror it here.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key !== STORAGE_KEY) return;
    session = readStored();
    emit(session && !isExpired(session.token) ? session.user : null);
  });
}

function readStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.user) return null;
    return { mode: parsed.mode === 'local' ? 'local' : 'api', token: parsed.token, user: parsed.user };
  } catch {
    return null;
  }
}

function setSession(next: StoredSession | null) {
  session = next;
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* storage unavailable: the session then lasts until the tab closes */ }
}

/** Expiry (ms since epoch) from the token's `exp` claim, or 0 when it cannot be read. */
export function tokenExpiry(token: string): number {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    return typeof claims.exp === 'number' ? claims.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

const isExpired = (token: string) => tokenExpiry(token) <= Date.now();

export const getToken = () => session?.token ?? null;
export const getSessionMode = (): AuthMode | null => session?.mode ?? null;
export const getSessionExpiry = () => (session ? tokenExpiry(session.token) : 0);

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

/** Thrown when the API cannot be reached at all (not running, proxy error, offline). */
class ApiUnreachableError extends Error {}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function request(path: string, init: RequestInit = {}, auth = false): Promise<{ status: number; data: any }> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (auth && session) headers.set('Authorization', `Bearer ${session.token}`);

  let res: Response;
  try {
    res = await fetch(path, { ...init, headers });
  } catch {
    throw new ApiUnreachableError();
  }

  const isJson = (res.headers.get('content-type') || '').includes('json');
  // The Vite dev proxy answers 5xx with a non-JSON body when the .NET API is not running.
  if (res.status >= 500 && !isJson) throw new ApiUnreachableError();

  const data = isJson ? await res.json().catch(() => ({})) : {};
  return { status: res.status, data };
}

/** fetch() for authenticated API calls. A 401 clears the session and signs the user out. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (session) headers.set('Authorization', `Bearer ${session.token}`);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && session?.mode === 'api') {
    setSession(null);
    emit(null);
  }
  return res;
}

const unreachableMessage = 'Cannot reach the server. Make sure the backend API is running, then try again.';

function apiError(status: number, data: any): AuthOutcome {
  if (status === 429) return { status: 'error', error: 'Too many attempts. Please wait a minute and try again.', code: 'rate_limited' };
  if (status >= 500) return { status: 'error', error: 'The server had a problem. Please try again in a moment.', code: 'server' };
  return { status: 'error', error: data?.error || data?.message || 'Something went wrong. Please try again.' };
}

// ---------------------------------------------------------------------------
// Sign in / sign up / sign out
// ---------------------------------------------------------------------------

async function authenticate(
  path: '/api/auth/login' | '/api/auth/signup',
  body: Record<string, unknown>,
  local: () => Promise<{ ok: true; user: User; token: string } | { ok: false; error: string }>
): Promise<AuthOutcome> {
  const useLocal = async (): Promise<AuthOutcome> => {
    const result = await local();
    if (!result.ok) return { status: 'error', error: result.error };
    setSession({ token: result.token, user: result.user, mode: 'local' });
    return { status: 'authenticated', user: result.user, mode: 'local' };
  };

  if (CONFIGURED_AUTH_MODE === 'local') return useLocal();

  try {
    const { status, data } = await request(path, { method: 'POST', body: JSON.stringify(body) });
    if (status >= 200 && status < 300 && data.success && data.token && data.user) {
      setSession({ token: data.token, user: data.user, mode: 'api' });
      return { status: 'authenticated', user: data.user, mode: 'api' };
    }
    return apiError(status, data);
  } catch (err) {
    if (err instanceof ApiUnreachableError && CONFIGURED_AUTH_MODE === 'auto') return useLocal();
    return { status: 'error', error: unreachableMessage, code: 'network' };
  }
}

export const login = (email: string, password: string) => {
  const e = normalizeEmail(email);
  return authenticate('/api/auth/login', { email: e, password }, () => localLogin(e, password));
};

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  role?: string;
  department?: string;
}

export const signup = (data: SignupInput) => {
  const body = { ...data, name: data.name.trim(), email: normalizeEmail(data.email) };
  return authenticate('/api/auth/signup', body, () => localSignup(body));
};

/**
 * Restores the session saved by a previous visit.
 * `expired` = there was a session but it is no longer valid (the UI shows a message).
 */
export async function restoreSession(): Promise<{ user: User | null; expired: boolean }> {
  if (!session) return { user: null, expired: false };
  if (isExpired(session.token)) {
    setSession(null);
    return { user: null, expired: true };
  }

  if (session.mode === 'local') {
    const user = await localFindUser(session.user.id);
    if (!user) {
      setSession(null);
      return { user: null, expired: true };
    }
    setSession({ ...session, user });
    return { user, expired: false };
  }

  try {
    const { status, data } = await request('/api/auth/me', {}, true);
    if (status === 401) {
      setSession(null);
      return { user: null, expired: true };
    }
    // Only trust /me when it describes the same account as the token we hold.
    if (status === 200 && data?.success && data.user?.id === session.user.id) {
      setSession({ ...session, user: { ...session.user, ...data.user } });
    }
  } catch { /* API unreachable right now: keep the stored session until its token expires */ }

  return { user: session ? session.user : null, expired: false };
}

export async function logout(): Promise<void> {
  const current = session;
  setSession(null);
  if (!current || current.mode !== 'api') return;
  try {
    await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${current.token}` } });
  } catch { /* the local session is already cleared */ }
}

// ---------------------------------------------------------------------------
// Account actions
// ---------------------------------------------------------------------------

const notAvailable = (what: string): ActionOutcome => ({
  status: 'unavailable',
  message: `${what} is not available yet: the server does not support it. Ask the backend team to add it (see docs/API_CONTRACT.md).`
});

/** PUT /api/users/me — updates the signed-in user's profile. */
export async function updateProfile(patch: { name: string; role: string; department: string }): Promise<{ outcome: ActionOutcome; user: User | null }> {
  if (!session) return { outcome: { status: 'error', message: 'You are signed out.' }, user: null };

  if (session.mode === 'local') {
    const user = await localUpdateProfile(session.user.id, patch);
    if (!user) return { outcome: { status: 'error', message: 'Account not found.' }, user: null };
    setSession({ ...session, user });
    return { outcome: { status: 'ok', message: 'Profile saved.' }, user };
  }

  try {
    const { status, data } = await request('/api/users/me', { method: 'PUT', body: JSON.stringify(patch) }, true);
    if (status >= 200 && status < 300) {
      const user = { ...session.user, ...patch, ...(data?.user || {}) };
      setSession({ ...session, user });
      return { outcome: { status: 'ok', message: 'Profile saved.' }, user };
    }
    if (status === 404 || status === 405) return { outcome: notAvailable('Saving your profile'), user: null };
    const err = apiError(status, data);
    return { outcome: { status: 'error', message: err.status === 'error' ? err.error : 'Could not save.' }, user: null };
  } catch {
    return { outcome: { status: 'error', message: unreachableMessage }, user: null };
  }
}

/** POST /api/auth/change-password */
export async function changePassword(currentPassword: string, newPassword: string): Promise<ActionOutcome> {
  if (!session) return { status: 'error', message: 'You are signed out.' };

  if (session.mode === 'local') {
    const result = await localChangePassword(session.user.id, currentPassword, newPassword);
    return result.ok ? { status: 'ok', message: 'Password updated.' } : { status: 'error', message: result.error || 'Could not update the password.' };
  }

  try {
    const { status, data } = await request('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }, true);
    if (status >= 200 && status < 300) return { status: 'ok', message: 'Password updated.' };
    if (status === 404 || status === 405) return notAvailable('Changing your password');
    const err = apiError(status, data);
    return { status: 'error', message: err.status === 'error' ? err.error : 'Could not update the password.' };
  } catch {
    return { status: 'error', message: unreachableMessage };
  }
}

/** POST /api/auth/forgot-password — asks the server to email a reset link. */
export async function requestPasswordReset(email: string): Promise<ActionOutcome> {
  const offline: ActionOutcome = {
    status: 'unavailable',
    message: 'You are in offline demo mode, so no email can be sent. Use one of the demo accounts, or create a new account.'
  };
  if (CONFIGURED_AUTH_MODE === 'local') return offline;

  try {
    const { status } = await request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: normalizeEmail(email) }) });
    if (status >= 200 && status < 300) {
      return { status: 'ok', message: 'If an account exists for that email, we have sent a link to reset the password.' };
    }
    if (status === 404 || status === 405) return notAvailable('Password reset');
    if (status === 429) return { status: 'error', message: 'Too many attempts. Please wait a minute and try again.' };
    return { status: 'error', message: 'Could not send the reset email. Please try again.' };
  } catch {
    return CONFIGURED_AUTH_MODE === 'auto' ? offline : { status: 'error', message: unreachableMessage };
  }
}

/** POST /api/auth/reset-password — sets a new password using the token from the reset email link. */
export async function resetPassword(token: string, newPassword: string): Promise<ActionOutcome> {
  const offline: ActionOutcome = {
    status: 'unavailable',
    message: 'You are in offline demo mode, so reset links cannot be used. Sign in with a demo account instead.'
  };
  if (CONFIGURED_AUTH_MODE === 'local') return offline;
  try {
    const { status, data } = await request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
    if (status >= 200 && status < 300) return { status: 'ok', message: 'Your password has been reset. Sign in with your new password.' };
    if (status === 404 || status === 405) return notAvailable('Password reset');
    if (status === 400 || status === 410) return { status: 'error', message: data?.error || 'This reset link is invalid or has expired. Request a new one.' };
    if (status === 429) return { status: 'error', message: 'Too many attempts. Please wait a minute and try again.' };
    return { status: 'error', message: 'Could not reset the password. Please try again.' };
  } catch {
    return CONFIGURED_AUTH_MODE === 'auto' ? offline : { status: 'error', message: unreachableMessage };
  }
}
