/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ClerkProvider, SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { HomePage } from './HomePage';
import { useProject } from '../context/ProjectContext';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Inner component that has access to both Clerk's useUser and ProjectContext
const ClerkUserSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const { teamMembers, switchUser } = useProject();

  useEffect(() => {
    if (!isLoaded || !clerkUser) return;

    // Try to find matching user by email
    const clerkEmail = clerkUser.primaryEmailAddress?.emailAddress;
    if (!clerkEmail) {
      console.warn('[Clerk Sync] No primary email found for Clerk user');
      return;
    }

    let matchingUser = teamMembers.find(
      u => u.email.toLowerCase() === clerkEmail.toLowerCase()
    );

    // If no match found, create a new team member from Clerk user data
    if (!matchingUser) {
      const newUser = {
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        email: clerkEmail,
        avatar: clerkUser.imageUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        role: 'Team Member',
        department: 'General',
        status: 'online' as const
      };
      
      // Add to team members (this will be persisted by ProjectContext)
      teamMembers.push(newUser);
      matchingUser = newUser;
      
      console.log('[Clerk Sync] Created new team member from Clerk user:', clerkEmail);
    }

    // Sync currentUser with the matched/created user
    switchUser(matchingUser);
    console.log('[Clerk Sync] Synchronized currentUser with Clerk user:', clerkEmail);
  }, [clerkUser, isLoaded, teamMembers, switchUser]);

  return <>{children}</>;
};

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error('VITE_CLERK_PUBLISHABLE_KEY is missing from environment variables');
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Configuration Error</h1>
          <p className="text-slate-600">
            Clerk publishable key is missing. Please check your .env file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <SignedOut>
        <HomePage />
      </SignedOut>
      <SignedIn>
        <ClerkUserSync>
          {children}
        </ClerkUserSync>
      </SignedIn>
    </ClerkProvider>
  );
};
