/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROUTES, isAppPath, navigate, usePath } from '../lib/router';
import { AuthDialog, type AuthMode } from './AuthDialog';

// The marketing page (and its animation library) is its own chunk.
const HomePage = lazy(() => import('./HomePage').then(m => ({ default: m.HomePage })));

const FullPageSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-screen bg-slate-50" role="status" aria-label="Loading">
    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
  </div>
);

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * Routing between the public home page and the workspace:
 *   /     home page for everyone (signed-in users get an "Open dashboard" button)
 *   /app  the workspace; signed-out visitors are sent to the home page with the sign-in dialog open
 */
export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { status, sessionExpired, user } = useAuth();
  const path = usePath();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  // Password-reset email links open /reset-password?token=... ; keep the token, then clean the address bar.
  const [resetToken] = useState<string | null>(() => {
    if (window.location.pathname !== ROUTES.resetPassword) return null;
    const token = new URLSearchParams(window.location.search).get('token');
    window.history.replaceState(null, '', ROUTES.home);
    return token;
  });
  useEffect(() => {
    if (resetToken && status === 'unauthenticated') setAuthMode('reset');
  }, [resetToken, status]);

  // Unknown addresses fall back to the home page.
  useEffect(() => {
    if (path !== ROUTES.home && !isAppPath(path)) navigate(ROUTES.home, { replace: true });
  }, [path]);

  // Signing in or up opens the workspace; signing out (or an expired session) returns to the home page.
  const previousStatus = useRef(status);
  useEffect(() => {
    const previous = previousStatus.current;
    previousStatus.current = status;
    if (previous === 'unauthenticated' && status === 'authenticated') {
      setAuthMode(null);
      navigate(ROUTES.app);
    } else if (previous === 'authenticated' && status === 'unauthenticated') {
      navigate(ROUTES.home, { replace: true });
    }
  }, [status]);

  // Opening /app while signed out: show the home page with the sign-in dialog.
  useEffect(() => {
    if (status === 'unauthenticated' && isAppPath(path)) {
      navigate(ROUTES.home, { replace: true });
      setAuthMode('signin');
    }
  }, [status, path]);

  // A session that ended on its own: take the user straight back to sign-in with an explanation.
  useEffect(() => {
    if (status === 'unauthenticated' && sessionExpired) setAuthMode('signin');
  }, [status, sessionExpired]);

  // Start the home page at the top.
  useEffect(() => {
    if (!isAppPath(path)) window.scrollTo({ top: 0 });
  }, [path]);

  if (status === 'loading') return <FullPageSpinner />;

  if (status === 'authenticated' && isAppPath(path)) return <>{children}</>;

  return (
    <>
      <Suspense fallback={<FullPageSpinner />}>
        <HomePage
          signedInName={status === 'authenticated' ? user?.name : undefined}
          onOpenApp={() => navigate(ROUTES.app)}
          onSignIn={() => setAuthMode('signin')}
          onSignUp={() => setAuthMode('signup')}
        />
      </Suspense>
      {status === 'unauthenticated' && authMode && (
        <AuthDialog
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={() => setAuthMode(null)}
          notice={sessionExpired ? 'Your session has ended. Please sign in again.' : undefined}
          resetToken={resetToken}
        />
      )}
    </>
  );
};
