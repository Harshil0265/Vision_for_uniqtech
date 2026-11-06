/**
 * /api/auth/* - JWT authentication and session management.
 *
 *   POST   /signup           create an account -> session
 *   POST   /login            email/password -> access token (+ refresh cookie)
 *   POST   /refresh          rotate refresh cookie -> new access token
 *   POST   /logout           revoke the current session
 *   POST   /logout-all       revoke every session of the user
 *   GET    /me               current user
 *   GET    /sessions         active sessions (devices)
 *   DELETE /sessions/:id     revoke one session
 *   POST   /change-password  change password and sign out other devices
 */

import express from 'express';
import { getAuthConfig } from './config';
import { clearRefreshCookie, readCookie, setRefreshCookie } from './cookies';
import { createRequireAuth, noStore, requireCsrfHeader, type AuthedRequest } from './middleware';
import { dummyVerify, hashPassword, validatePassword, verifyPassword } from './password';
import { checkEmailPolicy } from './emailPolicy';
import { parseRefreshToken, signAccessToken } from './tokens';
import { toPublicUser, type AuthStore, type PublicUser } from './store';
import { createRateLimiter } from '../rateLimit';

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

// Brute-force protection: per IP and per account.
const loginByIp = createRateLimiter(30, 15 * 60_000);
const loginByEmail = createRateLimiter(8, 15 * 60_000);
const signupByIp = createRateLimiter(10, 60 * 60_000);
const refreshByIp = createRateLimiter(120, 60_000);

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';

/** Self-contained initials avatar (no third-party image service). */
function defaultAvatar(name: string): string {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('') || 'U';
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="hsl(${hue},60%,45%)"/>` +
    `<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial,sans-serif" font-size="58" fill="#fff">${initials.replace(/[<>&]/g, '')}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createAuthRouter(store: AuthStore): express.Router {
  const router = express.Router();
  const requireAuth = createRequireAuth(store);
  router.use(noStore);

  const tooMany = (res: express.Response, retryAfterSec: number) => {
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      success: false,
      code: 'rate_limited',
      error: `Too many attempts. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`
    });
  };

  /** Creates a session and returns the JSON body; also sets the refresh cookie. */
  async function startSession(req: express.Request, res: express.Response, user: PublicUser) {
    const cfg = getAuthConfig();
    const session = await store.createSession(user.id, {
      userAgent: String(req.headers['user-agent'] || ''),
      ip: req.ip || ''
    });
    setRefreshCookie(res, session.refreshToken, session.expiresAt);
    return {
      success: true,
      accessToken: signAccessToken({ userId: user.id, sessionId: session.sessionId, email: user.email }),
      expiresIn: cfg.accessTtlSec,
      user
    };
  }

  // ---- signup ------------------------------------------------------------
  router.post('/signup', async (req, res) => {
    const ip = req.ip || 'unknown';
    const limit = signupByIp(ip);
    if (!limit.allowed) return tooMany(res, limit.retryAfterSec);

    const name = clean(req.body?.name, 80);
    const email = clean(req.body?.email, 254).toLowerCase();
    const password = req.body?.password;

    if (!name) return res.status(400).json({ success: false, code: 'validation', error: 'Name is required.' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ success: false, code: 'validation', error: 'Enter a valid email address.' });
    const policyError = checkEmailPolicy(email);
    if (policyError) return res.status(400).json({ success: false, code: 'email_not_allowed', error: policyError });
    const pwError = validatePassword(password, email);
    if (pwError) return res.status(400).json({ success: false, code: 'validation', error: pwError });

    try {
      const passwordHash = await hashPassword(password);
      const profile = {
        name,
        passwordHash,
        avatar: defaultAvatar(name),
        role: clean(req.body?.role, 60) || 'Member',
        department: clean(req.body?.department, 60) || 'General'
      };

      const taken = () =>
        res.status(409).json({ success: false, code: 'email_taken', error: 'An account with this email already exists. Try signing in.' });

      if (await store.findUserByEmail(email)) return taken();

      let user;
      try {
        user = await store.createUser({ ...profile, email });
      } catch (err: any) {
        if (err?.duplicate) return taken();
        throw err;
      }

      return res.status(201).json(await startSession(req, res, toPublicUser(user)));
    } catch (err: any) {
      console.error('[Auth] Signup failed:', err?.message);
      return res.status(500).json({ success: false, code: 'internal', error: 'Could not create the account.' });
    }
  });

  // ---- login -------------------------------------------------------------
  router.post('/login', async (req, res) => {
    const email = clean(req.body?.email, 254).toLowerCase();
    const password = req.body?.password;

    const ipLimit = loginByIp(req.ip || 'unknown');
    if (!ipLimit.allowed) return tooMany(res, ipLimit.retryAfterSec);
    const emailLimit = loginByEmail(email || 'empty');
    if (!emailLimit.allowed) return tooMany(res, emailLimit.retryAfterSec);

    // One generic message for every failure: never reveal whether the email exists.
    const invalid = () => res.status(401).json({ success: false, code: 'invalid_credentials', error: 'Invalid email or password.' });

    if (!EMAIL_RE.test(email) || typeof password !== 'string' || password.length === 0 || password.length > 200) {
      return invalid();
    }

    try {
      const user = await store.findUserByEmail(email);
      if (!user || !user.passwordHash) {
        await dummyVerify(password);
        return invalid();
      }
      if (!(await verifyPassword(password, user.passwordHash))) return invalid();

      loginByEmail.reset(email);
      const publicUser = toPublicUser(user);
      return res.json(await startSession(req, res, publicUser));
    } catch (err: any) {
      console.error('[Auth] Login failed:', err?.message);
      return res.status(500).json({ success: false, code: 'internal', error: 'Sign in failed. Please try again.' });
    }
  });

  // ---- refresh -----------------------------------------------------------
  router.post('/refresh', requireCsrfHeader, async (req, res) => {
    const cfg = getAuthConfig();
    const limit = refreshByIp(req.ip || 'unknown');
    if (!limit.allowed) return tooMany(res, limit.retryAfterSec);

    const parsed = parseRefreshToken(readCookie(req, cfg.cookieName));
    if (!parsed) {
      return res.status(401).json({ success: false, code: 'no_session', error: 'Not signed in' });
    }

    try {
      const result = await store.rotateSession(parsed.sessionId, parsed.hash);

      if (!result.ok) {
        if (result.reason === 'race') {
          // Another tab/request just rotated this token. The browser already holds the new cookie, so
          // the client simply retries. Not an attack, so the session stays alive.
          return res.status(409).json({ success: false, code: 'refresh_race', error: 'Retry' });
        }
        clearRefreshCookie(res);
        return res.status(401).json({ success: false, code: result.reason, error: 'Session expired. Please sign in again.' });
      }

      const user = await store.findUserById(result.userId);
      if (!user) {
        await store.revokeSession(result.sessionId, 'user_missing');
        clearRefreshCookie(res);
        return res.status(401).json({ success: false, code: 'no_session', error: 'Not signed in' });
      }

      setRefreshCookie(res, result.refreshToken, result.expiresAt);
      const publicUser = toPublicUser(user);
      return res.json({
        success: true,
        accessToken: signAccessToken({ userId: user.id, sessionId: result.sessionId, email: user.email }),
        expiresIn: cfg.accessTtlSec,
        user: publicUser
      });
    } catch (err: any) {
      console.error('[Auth] Refresh failed:', err?.message);
      return res.status(500).json({ success: false, code: 'internal', error: 'Could not refresh the session.' });
    }
  });

  // ---- logout ------------------------------------------------------------
  router.post('/logout', requireCsrfHeader, async (req, res) => {
    const cfg = getAuthConfig();
    const parsed = parseRefreshToken(readCookie(req, cfg.cookieName));
    if (parsed) {
      try {
        await store.revokeSession(parsed.sessionId, 'logout');
      } catch (err: any) {
        console.error('[Auth] Logout revoke failed:', err?.message);
      }
    }
    clearRefreshCookie(res);
    res.json({ success: true });
  });

  router.post('/logout-all', requireCsrfHeader, requireAuth, async (req, res) => {
    const { user } = req as AuthedRequest;
    const count = await store.revokeAllForUser(user.id, 'logout_all');
    clearRefreshCookie(res);
    res.json({ success: true, revoked: count });
  });

  // ---- profile & sessions ------------------------------------------------
  router.get('/me', requireAuth, async (req, res) => {
    const user = await store.findUserById((req as AuthedRequest).user.id);
    if (!user) return res.status(401).json({ success: false, code: 'invalid_token', error: 'User no longer exists' });
    const publicUser = toPublicUser(user);
    res.json({ success: true, user: publicUser });
  });

  router.get('/sessions', requireAuth, async (req, res) => {
    const { user } = req as AuthedRequest;
    const sessions = await store.listSessions(user.id);
    res.json({
      success: true,
      sessions: sessions.map(s => ({ ...s, current: s.id === user.sessionId }))
    });
  });

  router.delete('/sessions/:id', requireCsrfHeader, requireAuth, async (req, res) => {
    const { user } = req as AuthedRequest;
    const revoked = await store.revokeSession(String(req.params.id), 'revoked_by_user', user.id);
    if (!revoked) return res.status(404).json({ success: false, code: 'not_found', error: 'Session not found' });
    if (req.params.id === user.sessionId) clearRefreshCookie(res);
    res.json({ success: true });
  });

  router.post('/change-password', requireCsrfHeader, requireAuth, async (req, res) => {
    const { user } = req as AuthedRequest;
    const { currentPassword, newPassword } = req.body || {};

    const limit = loginByEmail(`pw:${user.id}`);
    if (!limit.allowed) return tooMany(res, limit.retryAfterSec);

    const pwError = validatePassword(newPassword, user.email);
    if (pwError) return res.status(400).json({ success: false, code: 'validation', error: pwError });

    const record = await store.findUserById(user.id);
    if (!record?.passwordHash || typeof currentPassword !== 'string' || !(await verifyPassword(currentPassword, record.passwordHash))) {
      return res.status(403).json({ success: false, code: 'invalid_credentials', error: 'Current password is incorrect.' });
    }

    await store.setPassword(user.id, await hashPassword(newPassword));
    // A password change must end every other login (they may belong to an attacker).
    const revoked = await store.revokeAllForUser(user.id, 'password_changed', user.sessionId);
    loginByEmail.reset(`pw:${user.id}`);
    res.json({ success: true, revokedOtherSessions: revoked });
  });

  // Best-effort cleanup of dead sessions; never blocks startup or requests.
  store.purgeStaleSessions().catch(() => undefined);
  setInterval(() => store.purgeStaleSessions().catch(() => undefined), 6 * 3600_000).unref();

  return router;
}
