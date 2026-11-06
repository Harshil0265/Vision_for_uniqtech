/** Express middleware that authenticates requests from the `Authorization: Bearer <access JWT>` header. */

import type express from 'express';
import { TokenError, verifyAccessToken } from './tokens';
import type { AuthStore } from './store';

export interface AuthUser {
  /** Database user id (UUID). */
  id: string;
  email: string;
  sessionId: string;
}

export type AuthedRequest = express.Request & { user: AuthUser };

export const noStore: express.RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};

export function createRequireAuth(store: AuthStore): express.RequestHandler {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, code: 'no_token', error: 'Authentication required' });
    }

    try {
      const claims = verifyAccessToken(header.slice(7).trim());

      // A valid signature is not enough: the session may have been revoked (logout, password change).
      if (!(await store.isSessionActive(claims.sid, claims.sub))) {
        return res.status(401).json({ success: false, code: 'session_revoked', error: 'Session is no longer active' });
      }

      (req as AuthedRequest).user = { id: claims.sub, email: claims.email, sessionId: claims.sid };
      return next();
    } catch (err) {
      if (err instanceof TokenError) {
        // `token_expired` tells the client to silently refresh; anything else means sign in again.
        return res.status(401).json({
          success: false,
          code: err.code,
          error: err.code === 'token_expired' ? 'Access token expired' : 'Invalid access token'
        });
      }
      console.error('[Auth] Middleware error:', err);
      return res.status(500).json({ success: false, code: 'internal', error: 'Authentication failed' });
    }
  };
}

/** Blocks cross-site form posts to cookie-authenticated endpoints (defence in depth with SameSite=Strict). */
export const requireCsrfHeader: express.RequestHandler = (req, res, next) => {
  if (req.headers['x-requested-with'] !== 'vision-web') {
    return res.status(403).json({ success: false, code: 'csrf', error: 'Missing required header' });
  }
  next();
};
