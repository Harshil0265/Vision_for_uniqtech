/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HomePage } from './HomePage';
import { AuthDialog, type AuthMode } from './AuthDialog';

interface AuthWrapperProps {
  children: React.ReactNode;
}

/** Shows the marketing page + sign-in dialog to visitors and the app to signed-in users. */
export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { status } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50" role="status" aria-label="Loading">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <>
        <HomePage onSignIn={() => setAuthMode('signin')} onSignUp={() => setAuthMode('signup')} />
        {authMode && (
          <AuthDialog mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthMode(null)} />
        )}
      </>
    );
  }

  return <>{children}</>;
};
