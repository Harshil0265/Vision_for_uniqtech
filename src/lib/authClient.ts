/**
 * Browser side of authentication. Talks to the Vision .NET API (/api/Auth/*).
 *
 * The API returns a signed JWT on sign-in. It is kept in localStorage with the user so a
 * reload keeps you signed in, and is sent as `Authorization: Bearer <token>` on API calls.
 */

import axios from 'axios';
import type { User } from '../types';
import { getCurrentUser, loginUser, logoutUser, signupUser } from '../api/authApi';

export type AuthMode = 'api';

const STORAGE_KEY = 'vision_auth_session';

interface StoredSession {
  token: string;
  user: User;
  mode: AuthMode;
}

export type AuthOutcome =
  | { status: 'authenticated'; user: User; mode: AuthMode; message?: string }
  | { status: 'registered'; user: User; message: string }
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
    localStorage.removeItem('vision_local_auth_v1');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.user || parsed.mode === 'local') {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { mode: 'api', token: parsed.token, user: parsed.user };
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
  if (res.status >= 500 && !isJson) throw new ApiUnreachableError();

  const data = isJson ? await res.json().catch(() => ({})) : {};
  return { status: res.status, data };
}

/** fetch() for authenticated API calls. A 401 clears the session and signs the user out. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (session) headers.set('Authorization', `Bearer ${session.token}`);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && session) {
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

export const login = async (email: string, password: string): Promise<AuthOutcome> => {
  const e = normalizeEmail(email);

  try {
    const resData = await loginUser({ email: e, password });
    if (resData?.success && resData.token && resData.user) {
      setSession({ token: resData.token, user: resData.user, mode: 'api' });
      return {
        status: 'authenticated',
        user: resData.user,
        mode: 'api',
        message: resData.message || 'Login successful!'
      };
    }
    return { status: 'error', error: 'Something went wrong. Please try again.' };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return apiError(err.response.status, err.response.data);
    }
    return { status: 'error', error: unreachableMessage, code: 'network' };
  }
};

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  role?: string;
  department?: string;
}

export const signup = async (data: SignupInput): Promise<AuthOutcome> => {
  const body = {
    name: data.name.trim(),
    email: normalizeEmail(data.email),
    password: data.password,
    role: data.role?.trim() || '',
    department: data.department?.trim() || ''
  };

  try {
    const resData = await signupUser(body);
    if (resData?.success && resData.user) {
      return {
        status: 'registered',
        user: resData.user,
        message: resData.message || 'Account created successfully! Please sign in.'
      };
    }
    return { status: 'error', error: 'Something went wrong. Please try again.' };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return apiError(err.response.status, err.response.data);
    }
    return { status: 'error', error: unreachableMessage, code: 'network' };
  }
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

  try {
    const data = await getCurrentUser();
    if (data?.success && data.user?.id === session.user.id) {
      setSession({ ...session, user: { ...session.user, ...data.user } });
    }
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      setSession(null);
      return { user: null, expired: true };
    }
  }

  return { user: session ? session.user : null, expired: false };
}

export async function logout(): Promise<void> {
  const current = session;
  setSession(null);
  if (!current) return;
  try {
    await logoutUser();
  } catch { /* the local session is already cleared */ }
}

// ---------------------------------------------------------------------------
// Account actions
// ---------------------------------------------------------------------------

const notAvailable = (what: string): ActionOutcome => ({
  status: 'unavailable',
  message: `${what} is not available yet: the server does not support it.`
});

/** PUT /api/users/me — updates the signed-in user's profile. */
export async function updateProfile(patch: { name: string; role: string; department: string }): Promise<{ outcome: ActionOutcome; user: User | null }> {
  if (!session) return { outcome: { status: 'error', message: 'You are signed out.' }, user: null };

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
  try {
    const { status } = await request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: normalizeEmail(email) }) });
    if (status >= 200 && status < 300) {
      return { status: 'ok', message: 'If an account exists for that email, we have sent a link to reset the password.' };
    }
    if (status === 404 || status === 405) return notAvailable('Password reset');
    if (status === 429) return { status: 'error', message: 'Too many attempts. Please wait a minute and try again.' };
    return { status: 'error', message: 'Could not send the reset email. Please try again.' };
  } catch {
    return { status: 'error', message: unreachableMessage };
  }
}

/** POST /api/auth/reset-password — sets a new password using the token from the reset email link. */
export async function resetPassword(token: string, newPassword: string): Promise<ActionOutcome> {
  try {
    const { status, data } = await request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
    if (status >= 200 && status < 300) return { status: 'ok', message: 'Your password has been reset. Sign in with your new password.' };
    if (status === 404 || status === 405) return notAvailable('Password reset');
    if (status === 400 || status === 410) return { status: 'error', message: data?.error || 'This reset link is invalid or has expired. Request a new one.' };
    if (status === 429) return { status: 'error', message: 'Too many attempts. Please wait a minute and try again.' };
    return { status: 'error', message: 'Could not reset the password. Please try again.' };
  } catch {
    return { status: 'error', message: unreachableMessage };
  }
}
