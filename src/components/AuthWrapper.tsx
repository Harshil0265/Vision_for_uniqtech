/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthDialog, type AuthMode } from './AuthDialog';

// The marketing page (and its animation library) is only downloaded by signed-out visitors.
const HomePage = lazy(() => import('./HomePage').then(m => ({ default: m.HomePage })));

const FullPageSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-screen bg-slate-50" role="status" aria-label="Loading">
    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
  </div>
);

interface AuthWrapperProps {
  children: React.ReactNode;
}

/** Shows the home page + sign-in / sign-up dialog to visitors and the app to signed-in users. */
export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { status, sessionExpired } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  // Password-reset email links open /reset-password?token=... ; keep the token, then clean the address bar.
  const [resetToken] = useState<string | null>(() => {
    if (window.location.pathname !== '/reset-password') return null;
    const token = new URLSearchParams(window.location.search).get('token');
    window.history.replaceState(null, '', '/');
    return token;
  });
  useEffect(() => {
    if (resetToken && status === 'unauthenticated') setAuthMode('reset');
  }, [resetToken, status]);

  // A session that ended on its own: take the user straight back to sign-in with an explanation.
  useEffect(() => {
    if (status === 'unauthenticated' && sessionExpired) setAuthMode('signin');
  }, [status, sessionExpired]);

  // Start the next visit at the top of the home page.
  useEffect(() => {
    if (status === 'unauthenticated') window.scrollTo({ top: 0 });
  }, [status]);

  if (status === 'loading') return <FullPageSpinner />;

  if (status === 'unauthenticated') {
    return (
      <>
        <Suspense fallback={<FullPageSpinner />}>
          <HomePage onSignIn={() => setAuthMode('signin')} onSignUp={() => setAuthMode('signup')} />
        </Suspense>
        {authMode && (
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
  }

  return <>{children}</>;
};
