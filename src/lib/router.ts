/**
 * Minimal path routing (no extra dependency):
 *   /                home page (everyone)
 *   /app             the workspace (signed-in users)
 *   /reset-password  password-reset links from email (?token=...)
 */

import { useEffect, useState } from 'react';

export const ROUTES = { home: '/', app: '/app', resetPassword: '/reset-password' } as const;

const EVENT = 'vision:navigate';

export function navigate(path: string, { replace = false } = {}) {
  if (window.location.pathname === path && !window.location.search) return;
  if (replace) window.history.replaceState(null, '', path);
  else window.history.pushState(null, '', path);
  window.dispatchEvent(new Event(EVENT));
}

/** Current pathname; re-renders on navigate() and on the browser's back/forward buttons. */
export function usePath(): string {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    window.addEventListener(EVENT, update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener(EVENT, update);
    };
  }, []);
  return path;
}

export const isAppPath = (path: string) => path === ROUTES.app || path.startsWith(`${ROUTES.app}/`);
