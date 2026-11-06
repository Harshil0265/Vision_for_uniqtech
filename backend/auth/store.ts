/**
 * Persistence for users and login sessions.
 *
 * Everything is kept in memory and mirrored to a local JSON file (default `.data/auth.json`,
 * override with AUTH_DATA_FILE) so accounts survive a server restart. No external database.
 *
 * Session model: one session record per login. It holds the SHA-256 of the current refresh token
 * plus the previous one, which is how token reuse (theft) is detected.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getAuthConfig } from './config';
import { newRefreshToken, safeEqual } from './tokens';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  department: string;
  status: 'online';
}

export interface UserRecord extends PublicUser {
  passwordHash: string | null;
}

export interface SessionInfo {
  id: string;
  userAgent: string;
  ip: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

export type RotateResult =
  | { ok: true; sessionId: string; userId: string; refreshToken: string; expiresAt: Date }
  | { ok: false; reason: 'invalid' | 'expired' | 'revoked' | 'reuse_detected' | 'race' };

interface SessionRow {
  id: string;
  userId: string;
  tokenHash: string;
  prevTokenHash: string | null;
  rotatedAt: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  absoluteExpiresAt: string;
  userAgent: string;
  ip: string;
  revokedAt: string | null;
  revokedReason: string | null;
}

interface Snapshot {
  users: UserRecord[];
  sessions: SessionRow[];
}

const ms = (sec: number) => sec * 1000;
const iso = (d: Date) => d.toISOString();

export function toPublicUser(row: Pick<UserRecord, 'id' | 'name' | 'email' | 'avatar' | 'role' | 'department'>): PublicUser {
  return {
    id: row.id,
    name: row.name || 'User',
    email: row.email,
    avatar: row.avatar || '',
    role: row.role || 'Member',
    department: row.department || 'General',
    status: 'online'
  };
}

export function createAuthStore(filePath: string | null = process.env.AUTH_DATA_FILE || path.resolve(process.cwd(), '.data', 'auth.json')) {
  const usersById = new Map<string, UserRecord>();
  const usersByEmail = new Map<string, UserRecord>();
  const sessions = new Map<string, SessionRow>();

  // ---- persistence ---------------------------------------------------------

  if (filePath && fs.existsSync(filePath)) {
    try {
      const snap = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Snapshot;
      for (const u of snap.users || []) { usersById.set(u.id, u); usersByEmail.set(u.email, u); }
      for (const s of snap.sessions || []) sessions.set(s.id, s);
      console.log(`[Auth] Loaded ${usersById.size} account(s) from ${filePath}`);
    } catch (err: any) {
      console.error(`[Auth] Could not read ${filePath} (${err?.message}). Starting with no accounts.`);
    }
  }

  let saveTimer: NodeJS.Timeout | null = null;
  function save() {
    if (!filePath || saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        const snap: Snapshot = { users: [...usersById.values()], sessions: [...sessions.values()] };
        const tmp = `${filePath}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(snap), { mode: 0o600 });
        fs.renameSync(tmp, filePath);
      } catch (err: any) {
        console.error('[Auth] Could not save accounts to disk:', err?.message);
      }
    }, 200);
    saveTimer.unref();
  }

  // ---- users ---------------------------------------------------------------

  async function findUserByEmail(email: string): Promise<UserRecord | null> {
    return usersByEmail.get(email) ?? null;
  }

  async function findUserById(id: string): Promise<UserRecord | null> {
    return usersById.get(id) ?? null;
  }

  async function createUser(input: {
    name: string; email: string; passwordHash: string; avatar: string; role: string; department: string;
  }): Promise<UserRecord> {
    if (usersByEmail.has(input.email)) {
      const e: any = new Error('Email already registered');
      e.duplicate = true;
      throw e;
    }
    const user: UserRecord = { ...toPublicUser({ id: crypto.randomUUID(), ...input }), passwordHash: input.passwordHash };
    usersById.set(user.id, user);
    usersByEmail.set(user.email, user);
    save();
    return user;
  }

  async function setPassword(userId: string, passwordHash: string): Promise<void> {
    const user = usersById.get(userId);
    if (!user) throw new Error('User not found');
    user.passwordHash = passwordHash;
    save();
  }

  // ---- sessions ------------------------------------------------------------

  async function createSession(userId: string, meta: { userAgent: string; ip: string }) {
    const cfg = getAuthConfig();
    const now = new Date();
    const sessionId = crypto.randomUUID();
    const refresh = newRefreshToken(sessionId);
    const absoluteExpiry = new Date(now.getTime() + ms(cfg.sessionMaxAgeSec));
    const expiresAt = new Date(Math.min(now.getTime() + ms(cfg.refreshTtlSec), absoluteExpiry.getTime()));

    sessions.set(sessionId, {
      id: sessionId,
      userId,
      tokenHash: refresh.hash,
      prevTokenHash: null,
      rotatedAt: null,
      createdAt: iso(now),
      lastUsedAt: iso(now),
      expiresAt: iso(expiresAt),
      absoluteExpiresAt: iso(absoluteExpiry),
      userAgent: meta.userAgent.slice(0, 300),
      ip: meta.ip.slice(0, 64),
      revokedAt: null,
      revokedReason: null
    });
    save();

    return { sessionId, refreshToken: refresh.token, expiresAt };
  }

  /**
   * Validates and rotates a refresh token. The old token stops working immediately; replaying it
   * after the grace window means it was stolen, so the whole session is revoked.
   */
  async function rotateSession(sessionId: string, presentedHash: string): Promise<RotateResult> {
    const cfg = getAuthConfig();
    const s = sessions.get(sessionId);
    if (!s) return { ok: false, reason: 'invalid' };
    if (s.revokedAt) return { ok: false, reason: 'revoked' };

    const now = new Date();
    if (new Date(s.expiresAt) <= now || new Date(s.absoluteExpiresAt) <= now) {
      await revokeSession(sessionId, 'expired');
      return { ok: false, reason: 'expired' };
    }

    if (!safeEqual(presentedHash, s.tokenHash)) {
      const isPrevious = s.prevTokenHash && safeEqual(presentedHash, s.prevTokenHash);
      const withinGrace = s.rotatedAt && now.getTime() - new Date(s.rotatedAt).getTime() <= ms(cfg.refreshGraceSec);
      if (isPrevious && withinGrace) return { ok: false, reason: 'race' };

      await revokeSession(sessionId, 'reuse_detected');
      console.warn(`[Auth] Refresh token reuse detected - session ${sessionId} revoked`);
      return { ok: false, reason: 'reuse_detected' };
    }

    // Single-threaded: nothing can interleave between the check above and this swap.
    const next = newRefreshToken(sessionId);
    const expiresAt = new Date(Math.min(now.getTime() + ms(cfg.refreshTtlSec), new Date(s.absoluteExpiresAt).getTime()));
    s.prevTokenHash = s.tokenHash;
    s.tokenHash = next.hash;
    s.rotatedAt = iso(now);
    s.lastUsedAt = iso(now);
    s.expiresAt = iso(expiresAt);
    save();

    return { ok: true, sessionId, userId: s.userId, refreshToken: next.token, expiresAt };
  }

  /** True if the session exists, is not revoked and has not hit its hard expiry. */
  async function isSessionActive(sessionId: string, userId: string): Promise<boolean> {
    const s = sessions.get(sessionId);
    return !!s && s.userId === userId && !s.revokedAt && new Date(s.absoluteExpiresAt) > new Date();
  }

  async function revokeSession(sessionId: string, reason: string, userId?: string): Promise<boolean> {
    const s = sessions.get(sessionId);
    if (!s || s.revokedAt || (userId && s.userId !== userId)) return false;
    s.revokedAt = iso(new Date());
    s.revokedReason = reason;
    save();
    return true;
  }

  async function revokeAllForUser(userId: string, reason: string, exceptSessionId?: string): Promise<number> {
    let count = 0;
    for (const s of sessions.values()) {
      if (s.userId !== userId || s.revokedAt || s.id === exceptSessionId) continue;
      s.revokedAt = iso(new Date());
      s.revokedReason = reason;
      count++;
    }
    if (count) save();
    return count;
  }

  async function listSessions(userId: string): Promise<SessionInfo[]> {
    const now = new Date();
    return [...sessions.values()]
      .filter(s => s.userId === userId && !s.revokedAt && new Date(s.absoluteExpiresAt) > now)
      .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt))
      .slice(0, 50)
      .map(s => ({
        id: s.id,
        userAgent: s.userAgent,
        ip: s.ip,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        expiresAt: s.expiresAt
      }));
  }

  /** Housekeeping: drop sessions that are long dead. Safe to call periodically. */
  async function purgeStaleSessions(): Promise<void> {
    const cutoff = iso(new Date(Date.now() - 7 * 86_400_000));
    let removed = 0;
    for (const [id, s] of sessions) {
      if (s.absoluteExpiresAt < cutoff || (s.revokedAt && s.revokedAt < cutoff)) { sessions.delete(id); removed++; }
    }
    if (removed) save();
  }

  return {
    findUserByEmail, findUserById, createUser, setPassword,
    createSession, rotateSession, isSessionActive, revokeSession, revokeAllForUser, listSessions, purgeStaleSessions
  };
}

export type AuthStore = ReturnType<typeof createAuthStore>;
