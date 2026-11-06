/**
 * Central auth configuration. Read lazily so dotenv has loaded before first use.
 *
 *  - Access token:  short-lived JWT (default 15 min), sent in the Authorization header,
 *                   kept in memory by the browser (never in localStorage).
 *  - Refresh token: opaque random secret (default 7 days, rotated on every use), delivered
 *                   only as an httpOnly cookie and stored server-side as a SHA-256 hash.
 *  - Session:       one row per login; hard-capped lifetime (default 30 days) regardless of rotation.
 */

import crypto from 'crypto';

export interface AuthConfig {
  accessSecret: string;
  accessTtlSec: number;
  refreshTtlSec: number;
  sessionMaxAgeSec: number;
  /** Window in which a just-rotated refresh token may be replayed (multi-tab race) without alarm. */
  refreshGraceSec: number;
  bcryptCost: number;
  issuer: string;
  audience: string;
  cookieName: string;
  cookiePath: string;
  secureCookies: boolean;
  isProd: boolean;
}

let cached: AuthConfig | null = null;

const intEnv = (name: string, fallback: number, min: number): number => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= min ? Math.floor(n) : fallback;
};

export function getAuthConfig(): AuthConfig {
  if (cached) return cached;

  const isProd = process.env.NODE_ENV === 'production';
  let secret = process.env.JWT_ACCESS_SECRET?.trim() || '';

  if (secret.length < 32) {
    if (isProd) {
      throw new Error('JWT_ACCESS_SECRET must be set to a random string of at least 32 characters in production.');
    }
    // Dev convenience only: an ephemeral secret. Access tokens die on restart, but sessions
    // survive because refresh tokens live in the auth data file, so the client re-authenticates silently.
    secret = crypto.randomBytes(48).toString('base64url');
    console.warn('[Auth] JWT_ACCESS_SECRET missing or shorter than 32 chars - using an ephemeral dev secret.');
    console.warn('[Auth] Generate one with: npm run auth:secret');
  }

  cached = {
    accessSecret: secret,
    accessTtlSec: intEnv('JWT_ACCESS_TTL_SECONDS', 15 * 60, 60),
    refreshTtlSec: intEnv('JWT_REFRESH_TTL_SECONDS', 7 * 24 * 3600, 300),
    sessionMaxAgeSec: intEnv('SESSION_MAX_AGE_SECONDS', 30 * 24 * 3600, 3600),
    refreshGraceSec: intEnv('REFRESH_GRACE_SECONDS', 10, 0),
    bcryptCost: intEnv('BCRYPT_COST', 12, 10),
    issuer: 'vision-api',
    audience: 'vision-app',
    cookieName: 'vision_rt',
    cookiePath: '/api/auth',
    secureCookies: isProd,
    isProd
  };
  return cached;
}
