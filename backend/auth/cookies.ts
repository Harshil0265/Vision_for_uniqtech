/** Refresh-token cookie helpers (httpOnly, SameSite=Strict, scoped to /api/auth). */

import type express from 'express';
import { getAuthConfig } from './config';

export function readCookie(req: express.Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0 && part.slice(0, idx).trim() === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export function setRefreshCookie(res: express.Response, token: string, expiresAt: Date): void {
  const cfg = getAuthConfig();
  res.cookie(cfg.cookieName, token, {
    httpOnly: true,
    secure: cfg.secureCookies,
    sameSite: 'strict',
    path: cfg.cookiePath,
    expires: expiresAt
  });
}

export function clearRefreshCookie(res: express.Response): void {
  const cfg = getAuthConfig();
  res.clearCookie(cfg.cookieName, {
    httpOnly: true,
    secure: cfg.secureCookies,
    sameSite: 'strict',
    path: cfg.cookiePath
  });
}
