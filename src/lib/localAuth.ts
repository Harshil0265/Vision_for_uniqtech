/**
 * Offline demo accounts, used ONLY when the .NET API cannot be reached (see authClient.ts).
 *
 * This lets the whole UI be opened and tested with just `npm run dev`. It is not security:
 * everything lives in this browser's localStorage. The seeded accounts use the same ids, emails and
 * passwords as the mock users in backend/Vision.API (MockAuthController), so data lines up in both modes.
 */

import type { User } from '../types';

const STORAGE_KEY = 'vision_local_accounts';
const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // same as the API's JWT lifetime

interface LocalAccount extends User {
  salt: string;
  passwordHash: string;
}

const SEED: { user: User; password: string }[] = [
  {
    user: {
      id: '00000000-0000-0000-0000-000000000001', name: 'Sarah Jenkins', email: 'sarah@vision.dev',
      avatar: '', role: 'Product Manager', department: 'Platform', status: 'online'
    },
    password: 'password123'
  },
  {
    user: {
      id: '00000000-0000-0000-0000-000000000002', name: 'Alex Rivera', email: 'alex@vision.dev',
      avatar: '', role: 'Architect', department: 'Engineering', status: 'online'
    },
    password: 'password123'
  },
  {
    user: {
      id: '00000000-0000-0000-0000-000000000003', name: 'Test User', email: 'test@test.com',
      avatar: '', role: 'Developer', department: 'Engineering', status: 'online'
    },
    password: 'test'
  }
];

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

async function hash(password: string, salt: string): Promise<string> {
  const input = `${salt}:${password}`;
  // crypto.subtle only exists on https:// and localhost; plain http on a LAN address falls back to FNV-1a.
  if (globalThis.crypto?.subtle) {
    return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)));
  }
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 0x01000193) >>> 0;
  return `fnv-${h.toString(16)}`;
}

const newId = () =>
  typeof globalThis.crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function read(): LocalAccount[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(accounts: LocalAccount[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts)); } catch { /* storage full or blocked */ }
}

async function accounts(): Promise<LocalAccount[]> {
  const list = read();
  if (list.length > 0) return list;
  const seeded = await Promise.all(SEED.map(async ({ user, password }) => {
    const salt = newId();
    return { ...user, salt, passwordHash: await hash(password, salt) };
  }));
  write(seeded);
  return seeded;
}

const publicUser = ({ salt, passwordHash, ...user }: LocalAccount): User => user;

const b64url = (value: string) => btoa(value).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

/** Unsigned token in JWT layout, so expiry handling is identical to the API's tokens. */
function issueToken(user: User): string {
  const header = b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ sub: user.id, email: user.email, exp: Math.floor((Date.now() + TOKEN_LIFETIME_MS) / 1000) }));
  return `${header}.${payload}.local`;
}

export type LocalResult = { ok: true; user: User; token: string } | { ok: false; error: string };

export async function localLogin(email: string, password: string): Promise<LocalResult> {
  const account = (await accounts()).find(a => a.email === email);
  if (!account || (await hash(password, account.salt)) !== account.passwordHash) {
    return { ok: false, error: 'Invalid email or password.' };
  }
  const user = publicUser(account);
  return { ok: true, user, token: issueToken(user) };
}

export async function localSignup(data: { name: string; email: string; password: string; role?: string; department?: string }): Promise<LocalResult> {
  const list = await accounts();
  if (list.some(a => a.email === data.email)) {
    return { ok: false, error: 'An account with this email already exists. Try signing in.' };
  }
  const salt = newId();
  const account: LocalAccount = {
    id: newId(),
    name: data.name,
    email: data.email,
    avatar: '',
    role: data.role || 'Developer',
    department: data.department || 'Engineering',
    status: 'online',
    salt,
    passwordHash: await hash(data.password, salt)
  };
  write([...list, account]);
  const user = publicUser(account);
  return { ok: true, user, token: issueToken(user) };
}

export async function localFindUser(id: string): Promise<User | null> {
  const account = (await accounts()).find(a => a.id === id);
  return account ? publicUser(account) : null;
}

export async function localUpdateProfile(id: string, patch: { name: string; role: string; department: string }): Promise<User | null> {
  const list = await accounts();
  const account = list.find(a => a.id === id);
  if (!account) return null;
  Object.assign(account, patch);
  write(list);
  return publicUser(account);
}

export async function localChangePassword(id: string, current: string, next: string): Promise<{ ok: boolean; error?: string }> {
  const list = await accounts();
  const account = list.find(a => a.id === id);
  if (!account || (await hash(current, account.salt)) !== account.passwordHash) {
    return { ok: false, error: 'Current password is incorrect.' };
  }
  account.salt = newId();
  account.passwordHash = await hash(next, account.salt);
  write(list);
  return { ok: true };
}
