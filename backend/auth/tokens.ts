/** JWT access tokens and opaque refresh tokens. */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getAuthConfig } from './config';

export interface AccessClaims {
  /** User id (UUID). */
  sub: string;
  /** Session id - lets the server revoke an access token by revoking its session. */
  sid: string;
  email: string;
}

export type TokenFailure = 'token_expired' | 'invalid_token';

export class TokenError extends Error {
  constructor(public code: TokenFailure) {
    super(code);
  }
}

export function signAccessToken(claims: { userId: string; sessionId: string; email: string }): string {
  const cfg = getAuthConfig();
  return jwt.sign({ sid: claims.sessionId, email: claims.email }, cfg.accessSecret, {
    algorithm: 'HS256',
    subject: claims.userId,
    issuer: cfg.issuer,
    audience: cfg.audience,
    expiresIn: cfg.accessTtlSec,
    jwtid: crypto.randomUUID()
  });
}

export function verifyAccessToken(token: string): AccessClaims {
  const cfg = getAuthConfig();
  try {
    // Pin the algorithm: never trust the token header (blocks alg=none / key-confusion attacks).
    const payload = jwt.verify(token, cfg.accessSecret, {
      algorithms: ['HS256'],
      issuer: cfg.issuer,
      audience: cfg.audience
    }) as jwt.JwtPayload;

    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
      throw new TokenError('invalid_token');
    }
    return { sub: payload.sub, sid: payload.sid, email: String(payload.email || '') };
  } catch (err) {
    if (err instanceof TokenError) throw err;
    if (err instanceof jwt.TokenExpiredError) throw new TokenError('token_expired');
    throw new TokenError('invalid_token');
  }
}

// ---------------------------------------------------------------------------
// Refresh tokens: "<sessionId>.<256-bit secret>". Only the SHA-256 of the whole value is stored.
// ---------------------------------------------------------------------------

export const hashToken = (value: string): string => crypto.createHash('sha256').update(value).digest('hex');

export function newRefreshToken(sessionId: string): { token: string; hash: string } {
  const token = `${sessionId}.${crypto.randomBytes(32).toString('base64url')}`;
  return { token, hash: hashToken(token) };
}

export function parseRefreshToken(token: string | undefined): { sessionId: string; hash: string } | null {
  if (!token || token.length > 200) return null;
  const [sessionId, secret] = token.split('.');
  if (!sessionId || !secret || !/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  return { sessionId, hash: hashToken(token) };
}

export const safeEqual = (a: string, b: string): boolean => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};
